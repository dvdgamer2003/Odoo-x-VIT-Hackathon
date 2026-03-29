import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConditionalRuleType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalEngineService } from './approval-engine.service';
import { TemplateRoutingService } from './template-routing.service';
import { ApprovalAuditService } from './approval-audit.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private engine: ApprovalEngineService,
    private routingService: TemplateRoutingService,
    private auditService: ApprovalAuditService,
  ) {}

  // ─── CHAIN INIT (called by ExpensesService) ──────────────────────────────────

  async initializeApprovalChain(
    expenseId: string,
    companyId: string,
    convertedAmount: number,
    submittedById: string,
  ) {
    return this.engine.initializeApprovalChain(
      expenseId,
      companyId,
      convertedAmount,
      submittedById,
    );
  }

  // ─── APPROVE / REJECT ───────────────────────────────────────────────────────

  async approve(expenseId: string, approverId: string, companyId: string, comments?: string) {
    return this.engine.approve(expenseId, approverId, companyId, comments);
  }

  async reject(expenseId: string, approverId: string, companyId: string, comments: string) {
    return this.engine.reject(expenseId, approverId, companyId, comments);
  }

  async adminOverride(
    expenseId: string,
    adminId: string,
    companyId: string,
    action: 'APPROVE' | 'REJECT',
    comments?: string,
  ) {
    return this.engine.adminOverride(expenseId, adminId, companyId, action, comments);
  }

  async getPendingForApprover(approverId: string, companyId: string) {
    return this.engine.getPendingForApprover(approverId, companyId);
  }

  async getExpenseChain(expenseId: string, companyId: string) {
    return this.engine.getExpenseChain(expenseId, companyId);
  }

  async getExpenseTimeline(expenseId: string, companyId: string) {
    const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, companyId } });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.auditService.getTimeline(expenseId, companyId);
  }

  // ─── TEMPLATES ──────────────────────────────────────────────────────────────

  async createTemplate(companyId: string, dto: {
    name: string;
    conditionalRuleType?: ConditionalRuleType;
    percentageThreshold?: number;
    specificApproverId?: string;
    isDefault?: boolean;
  }) {
    if (
      dto.conditionalRuleType === 'PERCENTAGE' ||
      dto.conditionalRuleType === 'HYBRID'
    ) {
      if (!dto.percentageThreshold || dto.percentageThreshold < 1 || dto.percentageThreshold > 100) {
        throw new BadRequestException('percentageThreshold must be between 1 and 100');
      }
    }

    if (
      dto.conditionalRuleType === 'SPECIFIC_APPROVER' ||
      dto.conditionalRuleType === 'HYBRID'
    ) {
      if (!dto.specificApproverId) {
        throw new BadRequestException('specificApproverId is required for SPECIFIC_APPROVER or HYBRID rules');
      }

      const approver = await this.prisma.user.findFirst({
        where: { id: dto.specificApproverId, companyId },
      });
      if (!approver) {
        throw new BadRequestException('specificApproverId must belong to the same company');
      }
    }

    // If this is set as default, unset others
    if (dto.isDefault) {
      await this.prisma.approvalTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.approvalTemplate.create({
      data: {
        companyId,
        name: dto.name,
        conditionalRuleType: dto.conditionalRuleType ?? 'NONE',
        percentageThreshold: dto.percentageThreshold ?? null,
        specificApproverId: dto.specificApproverId ?? null,
        isDefault: dto.isDefault ?? false,
      },
      include: { steps: { include: { approver: { select: { id: true, name: true } } } } },
    });
  }

  async getTemplates(companyId: string) {
    return this.prisma.approvalTemplate.findMany({
      where: { companyId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: { approver: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  async getTemplate(id: string, companyId: string) {
    const template = await this.prisma.approvalTemplate.findFirst({
      where: { id, companyId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: { approver: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateTemplate(id: string, companyId: string, dto: any) {
    await this.getTemplate(id, companyId);

    if (
      dto.conditionalRuleType === 'PERCENTAGE' ||
      dto.conditionalRuleType === 'HYBRID'
    ) {
      if (!dto.percentageThreshold || dto.percentageThreshold < 1 || dto.percentageThreshold > 100) {
        throw new BadRequestException('percentageThreshold must be between 1 and 100');
      }
    }

    if (
      dto.conditionalRuleType === 'SPECIFIC_APPROVER' ||
      dto.conditionalRuleType === 'HYBRID'
    ) {
      if (!dto.specificApproverId) {
        throw new BadRequestException('specificApproverId is required for SPECIFIC_APPROVER or HYBRID rules');
      }

      const approver = await this.prisma.user.findFirst({
        where: { id: dto.specificApproverId, companyId },
      });
      if (!approver) {
        throw new BadRequestException('specificApproverId must belong to the same company');
      }
    }

    if (dto.isDefault) {
      await this.prisma.approvalTemplate.updateMany({
        where: { companyId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.approvalTemplate.update({ where: { id }, data: dto });
  }

  async deleteTemplate(id: string, companyId: string) {
    await this.getTemplate(id, companyId);
    await this.prisma.approvalTemplate.delete({ where: { id } });
    return { message: 'Template deleted' };
  }

  // ─── STEPS ──────────────────────────────────────────────────────────────────

  async addStep(templateId: string, companyId: string, dto: {
    approverId: string;
    stepOrder: number;
    roleLabel?: string;
    isRequired?: boolean;
  }) {
    await this.getTemplate(templateId, companyId);

    // Validate approver belongs to company
    const approver = await this.prisma.user.findFirst({
      where: { id: dto.approverId, companyId },
    });
    if (!approver) throw new BadRequestException('Approver not found in this company');

    return this.prisma.approvalStep.create({
      data: {
        templateId,
        approverId: dto.approverId,
        stepOrder: dto.stepOrder,
        isRequired: dto.isRequired ?? true,
        roleLabel: dto.roleLabel ?? null,
      },
      include: { approver: { select: { id: true, name: true, email: true } } },
    });
  }

  async upsertRuleConfig(
    templateId: string,
    companyId: string,
    dto: {
      ruleType: ConditionalRuleType;
      percentageThreshold?: number | null;
      specificApproverId?: string | null;
      requireAllRequiredApprovals?: boolean;
      allowSpecificApproverOverride?: boolean;
    },
  ) {
    const template = await this.prisma.approvalTemplate.findFirst({ where: { id: templateId, companyId } });
    if (!template) throw new NotFoundException('Template not found');

    if (dto.ruleType === 'PERCENTAGE' || dto.ruleType === 'HYBRID') {
      if (!dto.percentageThreshold || dto.percentageThreshold < 1 || dto.percentageThreshold > 100) {
        throw new BadRequestException('percentageThreshold must be between 1 and 100');
      }
    }

    if (dto.ruleType === 'SPECIFIC_APPROVER' || dto.ruleType === 'HYBRID') {
      if (!dto.specificApproverId) {
        throw new BadRequestException('specificApproverId is required for SPECIFIC_APPROVER and HYBRID');
      }
      const approver = await this.prisma.user.findFirst({
        where: { id: dto.specificApproverId, companyId },
      });
      if (!approver) {
        throw new BadRequestException('specificApproverId must belong to the same company');
      }
    }

    return (this.prisma as any).approvalRuleConfig.upsert({
      where: { templateId },
      create: {
        templateId,
        ruleType: dto.ruleType,
        percentageThreshold: dto.percentageThreshold ?? null,
        specificApproverId: dto.specificApproverId ?? null,
        requireAllRequiredApprovals: dto.requireAllRequiredApprovals ?? true,
        allowSpecificApproverOverride: dto.allowSpecificApproverOverride ?? true,
      },
      update: {
        ruleType: dto.ruleType,
        percentageThreshold: dto.percentageThreshold ?? null,
        specificApproverId: dto.specificApproverId ?? null,
        requireAllRequiredApprovals: dto.requireAllRequiredApprovals ?? true,
        allowSpecificApproverOverride: dto.allowSpecificApproverOverride ?? true,
      },
    });
  }

  async getRuleConfig(templateId: string, companyId: string) {
    const template = await this.prisma.approvalTemplate.findFirst({ where: { id: templateId, companyId } });
    if (!template) throw new NotFoundException('Template not found');

    return (this.prisma as any).approvalRuleConfig.findUnique({ where: { templateId } });
  }

  async deleteStep(stepId: string, companyId: string) {
    const step = await this.prisma.approvalStep.findFirst({
      where: { id: stepId },
      include: { template: true },
    });
    if (!step || step.template.companyId !== companyId) {
      throw new NotFoundException('Step not found');
    }
    await this.prisma.approvalStep.delete({ where: { id: stepId } });
    return { message: 'Step deleted' };
  }

  // ─── ROUTING RULES ──────────────────────────────────────────────────────────

  createRoutingRule(companyId: string, dto: any) {
    return this.routingService.createRule(companyId, dto);
  }

  getRoutingRules(companyId: string) {
    return this.routingService.findAll(companyId);
  }

  getRoutingRule(id: string, companyId: string) {
    return this.routingService.findOne(id, companyId);
  }

  updateRoutingRule(id: string, companyId: string, dto: any) {
    return this.routingService.updateRule(id, companyId, dto);
  }

  deleteRoutingRule(id: string, companyId: string) {
    return this.routingService.deleteRule(id, companyId);
  }

  validateRoutingRules(companyId: string, rules: any[]) {
    return this.routingService.validateOverlapDryRun(companyId, rules);
  }

  previewRouting(companyId: string, amount: number) {
    return this.routingService.preview(companyId, amount);
  }
}
