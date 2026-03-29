"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApprovalEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalEngineService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const template_routing_service_1 = require("./template-routing.service");
const approval_chain_builder_service_1 = require("./approval-chain-builder.service");
const approval_rule_evaluator_service_1 = require("./approval-rule-evaluator.service");
const approval_audit_service_1 = require("./approval-audit.service");
const AUDIT_EVENT = {
    TEMPLATE_SELECTED: 'TEMPLATE_SELECTED',
    CHAIN_GENERATED: 'CHAIN_GENERATED',
    STEP_APPROVED: 'STEP_APPROVED',
    STEP_REJECTED: 'STEP_REJECTED',
    RULE_AUTO_APPROVED: 'RULE_AUTO_APPROVED',
    ADMIN_OVERRIDE: 'ADMIN_OVERRIDE',
    FINALIZED: 'FINALIZED',
};
let ApprovalEngineService = ApprovalEngineService_1 = class ApprovalEngineService {
    prisma;
    routingService;
    chainBuilder;
    ruleEvaluator;
    auditService;
    logger = new common_1.Logger(ApprovalEngineService_1.name);
    constructor(prisma, routingService, chainBuilder, ruleEvaluator, auditService) {
        this.prisma = prisma;
        this.routingService = routingService;
        this.chainBuilder = chainBuilder;
        this.ruleEvaluator = ruleEvaluator;
        this.auditService = auditService;
    }
    async initializeApprovalChain(expenseId, companyId, convertedAmount, submittedById) {
        const { templateId, routingRuleId } = await this.routingService.selectTemplate(companyId, convertedAmount);
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
    async approve(expenseId, approverId, companyId, comments) {
        return this.processAction(expenseId, approverId, companyId, 'APPROVE', comments);
    }
    async reject(expenseId, approverId, companyId, comments) {
        return this.processAction(expenseId, approverId, companyId, 'REJECT', comments);
    }
    async adminOverride(expenseId, adminId, companyId, action, comments) {
        const actor = await this.getApproverContext(adminId, companyId);
        if (actor.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only ADMIN can perform admin override');
        }
        return this.processAction(expenseId, adminId, companyId, action, comments, true);
    }
    async getPendingForApprover(approverId, companyId) {
        const actor = await this.getApproverContext(approverId, companyId);
        if (actor.role === client_1.Role.ADMIN) {
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
            const currentPendingByExpense = new Map();
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
        const pendingExpenses = [];
        for (const approval of approvals) {
            if (approval.expense.companyId !== companyId)
                continue;
            if (approval.expense.status !== 'PENDING')
                continue;
            const currentStep = await this.getCurrentStep(approval.expenseId);
            if (currentStep && currentStep.approverId === approverId) {
                pendingExpenses.push({ ...approval.expense, myApprovalStep: approval });
            }
        }
        return pendingExpenses;
    }
    async getExpenseChain(expenseId, companyId) {
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
        if (!expense)
            throw new common_1.NotFoundException('Expense not found');
        return expense;
    }
    async processAction(expenseId, approverId, companyId, action, comments, forceAdminOverride = false) {
        const { expense, currentStep, isAdminOverride, actor } = await this.validateApproverAction(expenseId, approverId, companyId, forceAdminOverride);
        const effectiveOverride = forceAdminOverride || isAdminOverride;
        const actionComments = this.buildActionComments(comments, approverId, effectiveOverride);
        const newStatus = action === 'APPROVE' ? client_1.ApprovalStatus.APPROVED : client_1.ApprovalStatus.REJECTED;
        await this.prisma.expenseApproval.update({
            where: { id: currentStep.id },
            data: { status: newStatus, comments: actionComments, actionedAt: new Date() },
        });
        const eventType = effectiveOverride
            ? AUDIT_EVENT.ADMIN_OVERRIDE
            : action === 'APPROVE'
                ? AUDIT_EVENT.STEP_APPROVED
                : AUDIT_EVENT.STEP_REJECTED;
        await this.auditService.log(expenseId, eventType, {
            action,
            stepOrder: currentStep.stepOrder,
            actedOnBehalfOfApproverId: effectiveOverride ? currentStep.approverId : undefined,
        }, actor.id);
        const allApprovals = await this.prisma.expenseApproval.findMany({
            where: { expenseId },
            orderBy: { stepOrder: 'asc' },
        });
        const ruleConfig = await this.getRuleConfig(expense.templateId);
        const decision = this.ruleEvaluator.evaluate(allApprovals.map((item) => ({
            approverId: item.approverId,
            status: item.status,
            isRequired: item.isRequired,
        })), ruleConfig);
        if (decision.finalStatus === 'APPROVED' || decision.finalStatus === 'REJECTED') {
            await this.finalizeExpense(expenseId, decision.finalStatus, allApprovals);
            if (decision.reason === 'SPECIFIC_APPROVER_OVERRIDE' ||
                decision.reason === 'HYBRID_RULE_SATISFIED' ||
                decision.reason === 'PERCENTAGE_RULE_SATISFIED') {
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
    async validateApproverAction(expenseId, approverId, companyId, forceAdminOverride = false) {
        const actor = await this.getApproverContext(approverId, companyId);
        const expense = await this.prisma.expense.findFirst({
            where: { id: expenseId, companyId },
        });
        if (!expense)
            throw new common_1.NotFoundException('Expense not found');
        if (expense.status !== 'PENDING') {
            throw new common_1.ConflictException(`Expense is already ${expense.status}`);
        }
        const currentStep = await this.getCurrentStep(expenseId);
        if (!currentStep)
            throw new common_1.BadRequestException('No pending approval step found');
        const isAdminOverride = actor.role === client_1.Role.ADMIN && currentStep.approverId !== approverId;
        if (forceAdminOverride && actor.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only ADMIN can perform admin override');
        }
        if (currentStep.approverId !== approverId && !isAdminOverride && !forceAdminOverride) {
            throw new common_1.ForbiddenException('It is not your turn to approve this expense');
        }
        return { expense, currentStep, isAdminOverride, actor };
    }
    async getApproverContext(approverId, companyId) {
        const approver = await this.prisma.user.findFirst({
            where: { id: approverId, companyId },
            select: { id: true, role: true },
        });
        if (!approver) {
            throw new common_1.ForbiddenException('User not found in this company');
        }
        return approver;
    }
    async getRuleConfig(templateId) {
        if (!templateId) {
            return {
                ruleType: client_1.ConditionalRuleType.NONE,
                percentageThreshold: null,
                specificApproverId: null,
                requireAllRequiredApprovals: true,
                allowSpecificApproverOverride: true,
            };
        }
        const config = await this.prisma.approvalRuleConfig?.findUnique?.({
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
            ruleType: template?.conditionalRuleType ?? client_1.ConditionalRuleType.NONE,
            percentageThreshold: template?.percentageThreshold ?? null,
            specificApproverId: template?.specificApproverId ?? null,
            requireAllRequiredApprovals: true,
            allowSpecificApproverOverride: true,
        };
    }
    buildActionComments(comments, approverId, isAdminOverride) {
        if (!isAdminOverride)
            return comments;
        const overrideNote = `[Admin override by ${approverId}]`;
        if (!comments)
            return overrideNote;
        return `${overrideNote} ${comments}`;
    }
    async getCurrentStep(expenseId) {
        return this.prisma.expenseApproval.findFirst({
            where: { expenseId, status: 'PENDING' },
            orderBy: { stepOrder: 'asc' },
        });
    }
    async finalizeExpense(expenseId, finalStatus, allApprovals) {
        const pendingIds = allApprovals
            .filter((a) => a.status === 'PENDING')
            .map((a) => a.id);
        const ops = [
            this.prisma.expense.update({
                where: { id: expenseId },
                data: {
                    status: finalStatus,
                    currentApprovalStepOrder: null,
                },
            }),
        ];
        if (pendingIds.length > 0) {
            ops.push(this.prisma.expenseApproval.updateMany({
                where: { id: { in: pendingIds } },
                data: { status: 'SKIPPED' },
            }));
        }
        await this.prisma.$transaction(ops);
    }
};
exports.ApprovalEngineService = ApprovalEngineService;
exports.ApprovalEngineService = ApprovalEngineService = ApprovalEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        template_routing_service_1.TemplateRoutingService,
        approval_chain_builder_service_1.ApprovalChainBuilderService,
        approval_rule_evaluator_service_1.ApprovalRuleEvaluatorService,
        approval_audit_service_1.ApprovalAuditService])
], ApprovalEngineService);
//# sourceMappingURL=approval-engine.service.js.map