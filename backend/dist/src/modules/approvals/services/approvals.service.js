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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const approval_engine_service_1 = require("./approval-engine.service");
const template_routing_service_1 = require("./template-routing.service");
const approval_audit_service_1 = require("./approval-audit.service");
let ApprovalsService = class ApprovalsService {
    prisma;
    engine;
    routingService;
    auditService;
    constructor(prisma, engine, routingService, auditService) {
        this.prisma = prisma;
        this.engine = engine;
        this.routingService = routingService;
        this.auditService = auditService;
    }
    async initializeApprovalChain(expenseId, companyId, convertedAmount, submittedById) {
        return this.engine.initializeApprovalChain(expenseId, companyId, convertedAmount, submittedById);
    }
    async approve(expenseId, approverId, companyId, comments) {
        return this.engine.approve(expenseId, approverId, companyId, comments);
    }
    async reject(expenseId, approverId, companyId, comments) {
        return this.engine.reject(expenseId, approverId, companyId, comments);
    }
    async adminOverride(expenseId, adminId, companyId, action, comments) {
        return this.engine.adminOverride(expenseId, adminId, companyId, action, comments);
    }
    async getPendingForApprover(approverId, companyId) {
        return this.engine.getPendingForApprover(approverId, companyId);
    }
    async getExpenseChain(expenseId, companyId) {
        return this.engine.getExpenseChain(expenseId, companyId);
    }
    async getExpenseTimeline(expenseId, companyId) {
        const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, companyId } });
        if (!expense)
            throw new common_1.NotFoundException('Expense not found');
        return this.auditService.getTimeline(expenseId, companyId);
    }
    async createTemplate(companyId, dto) {
        if (dto.conditionalRuleType === 'PERCENTAGE' ||
            dto.conditionalRuleType === 'HYBRID') {
            if (!dto.percentageThreshold || dto.percentageThreshold < 1 || dto.percentageThreshold > 100) {
                throw new common_1.BadRequestException('percentageThreshold must be between 1 and 100');
            }
        }
        if (dto.conditionalRuleType === 'SPECIFIC_APPROVER' ||
            dto.conditionalRuleType === 'HYBRID') {
            if (!dto.specificApproverId) {
                throw new common_1.BadRequestException('specificApproverId is required for SPECIFIC_APPROVER or HYBRID rules');
            }
            const approver = await this.prisma.user.findFirst({
                where: { id: dto.specificApproverId, companyId },
            });
            if (!approver) {
                throw new common_1.BadRequestException('specificApproverId must belong to the same company');
            }
        }
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
    async getTemplates(companyId) {
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
    async getTemplate(id, companyId) {
        const template = await this.prisma.approvalTemplate.findFirst({
            where: { id, companyId },
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' },
                    include: { approver: { select: { id: true, name: true, email: true } } },
                },
            },
        });
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        return template;
    }
    async updateTemplate(id, companyId, dto) {
        await this.getTemplate(id, companyId);
        if (dto.conditionalRuleType === 'PERCENTAGE' ||
            dto.conditionalRuleType === 'HYBRID') {
            if (!dto.percentageThreshold || dto.percentageThreshold < 1 || dto.percentageThreshold > 100) {
                throw new common_1.BadRequestException('percentageThreshold must be between 1 and 100');
            }
        }
        if (dto.conditionalRuleType === 'SPECIFIC_APPROVER' ||
            dto.conditionalRuleType === 'HYBRID') {
            if (!dto.specificApproverId) {
                throw new common_1.BadRequestException('specificApproverId is required for SPECIFIC_APPROVER or HYBRID rules');
            }
            const approver = await this.prisma.user.findFirst({
                where: { id: dto.specificApproverId, companyId },
            });
            if (!approver) {
                throw new common_1.BadRequestException('specificApproverId must belong to the same company');
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
    async deleteTemplate(id, companyId) {
        await this.getTemplate(id, companyId);
        await this.prisma.approvalTemplate.delete({ where: { id } });
        return { message: 'Template deleted' };
    }
    async addStep(templateId, companyId, dto) {
        await this.getTemplate(templateId, companyId);
        const approver = await this.prisma.user.findFirst({
            where: { id: dto.approverId, companyId },
        });
        if (!approver)
            throw new common_1.BadRequestException('Approver not found in this company');
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
    async upsertRuleConfig(templateId, companyId, dto) {
        const template = await this.prisma.approvalTemplate.findFirst({ where: { id: templateId, companyId } });
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        if (dto.ruleType === 'PERCENTAGE' || dto.ruleType === 'HYBRID') {
            if (!dto.percentageThreshold || dto.percentageThreshold < 1 || dto.percentageThreshold > 100) {
                throw new common_1.BadRequestException('percentageThreshold must be between 1 and 100');
            }
        }
        if (dto.ruleType === 'SPECIFIC_APPROVER' || dto.ruleType === 'HYBRID') {
            if (!dto.specificApproverId) {
                throw new common_1.BadRequestException('specificApproverId is required for SPECIFIC_APPROVER and HYBRID');
            }
            const approver = await this.prisma.user.findFirst({
                where: { id: dto.specificApproverId, companyId },
            });
            if (!approver) {
                throw new common_1.BadRequestException('specificApproverId must belong to the same company');
            }
        }
        return this.prisma.approvalRuleConfig.upsert({
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
    async getRuleConfig(templateId, companyId) {
        const template = await this.prisma.approvalTemplate.findFirst({ where: { id: templateId, companyId } });
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        return this.prisma.approvalRuleConfig.findUnique({ where: { templateId } });
    }
    async deleteStep(stepId, companyId) {
        const step = await this.prisma.approvalStep.findFirst({
            where: { id: stepId },
            include: { template: true },
        });
        if (!step || step.template.companyId !== companyId) {
            throw new common_1.NotFoundException('Step not found');
        }
        await this.prisma.approvalStep.delete({ where: { id: stepId } });
        return { message: 'Step deleted' };
    }
    createRoutingRule(companyId, dto) {
        return this.routingService.createRule(companyId, dto);
    }
    getRoutingRules(companyId) {
        return this.routingService.findAll(companyId);
    }
    getRoutingRule(id, companyId) {
        return this.routingService.findOne(id, companyId);
    }
    updateRoutingRule(id, companyId, dto) {
        return this.routingService.updateRule(id, companyId, dto);
    }
    deleteRoutingRule(id, companyId) {
        return this.routingService.deleteRule(id, companyId);
    }
    validateRoutingRules(companyId, rules) {
        return this.routingService.validateOverlapDryRun(companyId, rules);
    }
    previewRouting(companyId, amount) {
        return this.routingService.preview(companyId, amount);
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approval_engine_service_1.ApprovalEngineService,
        template_routing_service_1.TemplateRoutingService,
        approval_audit_service_1.ApprovalAuditService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map