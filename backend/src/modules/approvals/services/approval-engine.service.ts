import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalStatus, ConditionalRuleType, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TemplateRoutingService } from './template-routing.service';
import { ApprovalChainBuilderService } from './approval-chain-builder.service';
import { ApprovalRuleEvaluatorService } from './approval-rule-evaluator.service';
import { ApprovalAuditService } from './approval-audit.service';

const AUDIT_EVENT = {
  TEMPLATE_SELECTED: 'TEMPLATE_SELECTED',
  CHAIN_GENERATED: 'CHAIN_GENERATED',
  STEP_APPROVED: 'STEP_APPROVED',
  STEP_REJECTED: 'STEP_REJECTED',
  RULE_AUTO_APPROVED: 'RULE_AUTO_APPROVED',
  ADMIN_OVERRIDE: 'ADMIN_OVERRIDE',
  FINALIZED: 'FINALIZED',
} as const;

type ApproverContext = {
  id: string;
  role: Role;
};

@Injectable()
export class ApprovalEngineService {
  private readonly logger = new Logger(ApprovalEngineService.name);

  constructor(
    private prisma: PrismaService,
    private routingService: TemplateRoutingService,
    private chainBuilder: ApprovalChainBuilderService,
    private ruleEvaluator: ApprovalRuleEvaluatorService,
    private auditService: ApprovalAuditService,
  ) {}

  // ─── INITIALIZE APPROVAL CHAIN ───────────────────────────────────────────────

  async initializeApprovalChain(
    expenseId: string,
    companyId: string,
    convertedAmount: number,
    submittedById: string,
  ) {
    // Step 1: Select template via routing service
    const { templateId, routingRuleId } = await this.routingService.selectTemplate(
      companyId,
      convertedAmount,
    );

    await this.auditService.log(expenseId, AUDIT_EVENT.TEMPLATE_SELECTED, {
      templateId,
      routingRuleId,
      convertedAmount,
    });

    const chain = await this.chainBuilder.buildChain(templateId, companyId, submittedById);

    if (chain.length === 0) {
      await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          status: 'APPROVED',
          templateId,
          routingRuleId,
          currentApprovalStepOrder: null,
          workflowMetadata: {
            chainLength: 0,
            managerFirstApplied: false,
          },
        },
      });

      await this.auditService.log(expenseId, AUDIT_EVENT.CHAIN_GENERATED, {
        steps: 0,
      });
      await this.auditService.log(expenseId, AUDIT_EVENT.FINALIZED, {
        status: 'APPROVED',
        reason: 'NO_APPROVERS',
      });
      return;
    }

    await this.prisma.$transaction([
      this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          templateId,
          routingRuleId,
          currentApprovalStepOrder: chain[0].stepOrder,
          workflowMetadata: {
            chainLength: chain.length,
            managerFirstApplied: chain.some((step) => step.source === 'MANAGER_FIRST'),
          },
        },
      }),
      this.prisma.expenseApproval.createMany({
        data: this.chainBuilder.toCreateInputs(expenseId, chain),
      }),
    ]);

    await this.auditService.log(expenseId, AUDIT_EVENT.CHAIN_GENERATED, {
      steps: chain.length,
    });

    this.logger.log(`Initialized ${chain.length} approval steps for expense ${expenseId}`);
  }

  // ─── APPROVE ─────────────────────────────────────────────────────────────────

  async approve(expenseId: string, approverId: string, companyId: string, comments?: string) {
    return this.processAction(expenseId, approverId, companyId, 'APPROVE', comments);
  }

  async reject(expenseId: string, approverId: string, companyId: string, comments: string) {
    return this.processAction(expenseId, approverId, companyId, 'REJECT', comments);
  }

  async adminOverride(
    expenseId: string,
    adminId: string,
    companyId: string,
    action: 'APPROVE' | 'REJECT',
    comments?: string,
  ) {
    const actor = await this.getApproverContext(adminId, companyId);
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only ADMIN can perform admin override');
    }

    return this.processAction(expenseId, adminId, companyId, action, comments, true);
  }

  // ─── PENDING FOR APPROVER ────────────────────────────────────────────────────

  async getPendingForApprover(approverId: string, companyId: string) {
    const actor = await this.getApproverContext(approverId, companyId);

    if (actor.role === Role.ADMIN) {
      // Admin sees one current pending step per expense in their company.
      const pendingApprovals = await this.prisma.expenseApproval.findMany({
        where: {
          status: 'PENDING',
          expense: { companyId, status: 'PENDING' },
        },
        include: {
          expense: {
            include: {
              submittedBy: { select: { id: true, name: true, email: true } },
              company: { select: { id: true, defaultCurrency: true } },
            },
          },
        },
        orderBy: [{ expenseId: 'asc' }, { stepOrder: 'asc' }],
      });

      const currentPendingByExpense = new Map<string, any>();
      for (const approval of pendingApprovals) {
        if (!currentPendingByExpense.has(approval.expenseId)) {
          currentPendingByExpense.set(approval.expenseId, {
            ...approval.expense,
            myApprovalStep: approval,
          });
        }
      }

      return Array.from(currentPendingByExpense.values());
    }

    // Get all PENDING approvals assigned to this user.
    const approvals = await this.prisma.expenseApproval.findMany({
      where: { approverId, status: 'PENDING' },
      include: {
        expense: {
          include: {
            submittedBy: { select: { id: true, name: true, email: true } },
            company: { select: { id: true, defaultCurrency: true } },
          },
        },
      },
    });

    // Filter to only the expenses where this approver is the CURRENT step.
    const pendingExpenses = [];
    for (const approval of approvals) {
      if (approval.expense.companyId !== companyId) continue;
      if (approval.expense.status !== 'PENDING') continue;

      const currentStep = await this.getCurrentStep(approval.expenseId);
      if (currentStep && currentStep.approverId === approverId) {
        pendingExpenses.push({ ...approval.expense, myApprovalStep: approval });
      }
    }

    return pendingExpenses;
  }

  async getExpenseChain(expenseId: string, companyId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, companyId },
      include: {
        approvals: {
          orderBy: { stepOrder: 'asc' },
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
        },
        template: { select: { id: true, name: true } },
      },
    });

    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private async processAction(
    expenseId: string,
    approverId: string,
    companyId: string,
    action: 'APPROVE' | 'REJECT',
    comments?: string,
    forceAdminOverride = false,
  ) {
    const { expense, currentStep, isAdminOverride, actor } = await this.validateApproverAction(
      expenseId,
      approverId,
      companyId,
      forceAdminOverride,
    );

    const effectiveOverride = forceAdminOverride || isAdminOverride;
    const actionComments = this.buildActionComments(comments, approverId, effectiveOverride);

    const newStatus = action === 'APPROVE' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    await this.prisma.expenseApproval.update({
      where: { id: currentStep.id },
      data: { status: newStatus, comments: actionComments, actionedAt: new Date() },
    });

    const eventType = effectiveOverride
      ? AUDIT_EVENT.ADMIN_OVERRIDE
      : action === 'APPROVE'
        ? AUDIT_EVENT.STEP_APPROVED
        : AUDIT_EVENT.STEP_REJECTED;

    await this.auditService.log(
      expenseId,
      eventType,
      {
        action,
        stepOrder: currentStep.stepOrder,
        actedOnBehalfOfApproverId: effectiveOverride ? currentStep.approverId : undefined,
      },
      actor.id,
    );

    const allApprovals = await this.prisma.expenseApproval.findMany({
      where: { expenseId },
      orderBy: { stepOrder: 'asc' },
    });
    const ruleConfig = await this.getRuleConfig(expense.templateId);
    const decision = this.ruleEvaluator.evaluate(
      allApprovals.map((item) => ({
        approverId: item.approverId,
        status: item.status,
        isRequired: item.isRequired,
      })),
      ruleConfig,
    );

    if (decision.finalStatus === 'APPROVED' || decision.finalStatus === 'REJECTED') {
      await this.finalizeExpense(expenseId, decision.finalStatus, allApprovals);

      if (
        decision.reason === 'SPECIFIC_APPROVER_OVERRIDE' ||
        decision.reason === 'HYBRID_RULE_SATISFIED' ||
        decision.reason === 'PERCENTAGE_RULE_SATISFIED'
      ) {
        await this.auditService.log(expenseId, AUDIT_EVENT.RULE_AUTO_APPROVED, {
          reason: decision.reason,
          ruleType: ruleConfig.ruleType,
        });
      }

      await this.auditService.log(expenseId, AUDIT_EVENT.FINALIZED, {
        status: decision.finalStatus,
        reason: decision.reason,
      });

      return { status: decision.finalStatus, reason: decision.reason };
    }

    const nextStep = await this.getCurrentStep(expenseId);
    await this.prisma.expense.update({
      where: { id: expenseId },
      data: { currentApprovalStepOrder: nextStep?.stepOrder ?? null },
    });

    return { status: 'PENDING', reason: decision.reason };
  }

  private async validateApproverAction(
    expenseId: string,
    approverId: string,
    companyId: string,
    forceAdminOverride = false,
  ) {
    const actor = await this.getApproverContext(approverId, companyId);

    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, companyId },
    });

    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status !== 'PENDING') {
      throw new ConflictException(`Expense is already ${expense.status}`);
    }

    const currentStep = await this.getCurrentStep(expenseId);
    if (!currentStep) throw new BadRequestException('No pending approval step found');

    const isAdminOverride = actor.role === Role.ADMIN && currentStep.approverId !== approverId;

    if (forceAdminOverride && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only ADMIN can perform admin override');
    }

    if (currentStep.approverId !== approverId && !isAdminOverride && !forceAdminOverride) {
      throw new ForbiddenException('It is not your turn to approve this expense');
    }

    return { expense, currentStep, isAdminOverride, actor };
  }

  private async getApproverContext(approverId: string, companyId: string): Promise<ApproverContext> {
    const approver = await this.prisma.user.findFirst({
      where: { id: approverId, companyId },
      select: { id: true, role: true },
    });

    if (!approver) {
      throw new ForbiddenException('User not found in this company');
    }

    return approver;
  }

  private async getRuleConfig(templateId: string | null) {
    if (!templateId) {
      return {
        ruleType: ConditionalRuleType.NONE,
        percentageThreshold: null,
        specificApproverId: null,
        requireAllRequiredApprovals: true,
        allowSpecificApproverOverride: true,
      };
    }

    const config = await (this.prisma as any).approvalRuleConfig?.findUnique?.({
      where: { templateId },
    });

    if (config) {
      return {
        ruleType: config.ruleType,
        percentageThreshold: config.percentageThreshold,
        specificApproverId: config.specificApproverId,
        requireAllRequiredApprovals: config.requireAllRequiredApprovals,
        allowSpecificApproverOverride: config.allowSpecificApproverOverride,
      };
    }

    const template = await this.prisma.approvalTemplate.findUnique({
      where: { id: templateId },
      select: {
        conditionalRuleType: true,
        percentageThreshold: true,
        specificApproverId: true,
      },
    });

    return {
      ruleType: template?.conditionalRuleType ?? ConditionalRuleType.NONE,
      percentageThreshold: template?.percentageThreshold ?? null,
      specificApproverId: template?.specificApproverId ?? null,
      requireAllRequiredApprovals: true,
      allowSpecificApproverOverride: true,
    };
  }

  private buildActionComments(
    comments: string | undefined,
    approverId: string,
    isAdminOverride: boolean,
  ) {
    if (!isAdminOverride) return comments;

    const overrideNote = `[Admin override by ${approverId}]`;
    if (!comments) return overrideNote;

    return `${overrideNote} ${comments}`;
  }

  private async getCurrentStep(expenseId: string) {
    return this.prisma.expenseApproval.findFirst({
      where: { expenseId, status: 'PENDING' },
      orderBy: { stepOrder: 'asc' },
    });
  }

  private async finalizeExpense(
    expenseId: string,
    finalStatus: 'APPROVED' | 'REJECTED',
    allApprovals: any[],
  ) {
    const pendingIds = allApprovals
      .filter((a) => a.status === 'PENDING')
      .map((a) => a.id);

    const ops: any[] = [
      this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          status: finalStatus,
          currentApprovalStepOrder: null,
        },
      }),
    ];

    if (pendingIds.length > 0) {
      ops.push(
        this.prisma.expenseApproval.updateMany({
          where: { id: { in: pendingIds } },
          data: { status: 'SKIPPED' },
        }),
      );
    }

    await this.prisma.$transaction(ops);
  }
}
