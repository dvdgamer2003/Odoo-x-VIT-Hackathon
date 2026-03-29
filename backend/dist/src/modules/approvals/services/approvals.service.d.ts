import { ConditionalRuleType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalEngineService } from './approval-engine.service';
import { TemplateRoutingService } from './template-routing.service';
import { ApprovalAuditService } from './approval-audit.service';
export declare class ApprovalsService {
    private prisma;
    private engine;
    private routingService;
    private auditService;
    constructor(prisma: PrismaService, engine: ApprovalEngineService, routingService: TemplateRoutingService, auditService: ApprovalAuditService);
    initializeApprovalChain(expenseId: string, companyId: string, convertedAmount: number, submittedById: string): Promise<void>;
    approve(expenseId: string, approverId: string, companyId: string, comments?: string): Promise<{
        status: string;
        reason: "REQUIRED_REJECTION" | "SPECIFIC_APPROVER_OVERRIDE" | "HYBRID_RULE_SATISFIED" | "PERCENTAGE_RULE_SATISFIED" | "ALL_REQUIRED_STEPS_APPROVED" | "AWAITING_NEXT_STEP";
    }>;
    reject(expenseId: string, approverId: string, companyId: string, comments: string): Promise<{
        status: string;
        reason: "REQUIRED_REJECTION" | "SPECIFIC_APPROVER_OVERRIDE" | "HYBRID_RULE_SATISFIED" | "PERCENTAGE_RULE_SATISFIED" | "ALL_REQUIRED_STEPS_APPROVED" | "AWAITING_NEXT_STEP";
    }>;
    adminOverride(expenseId: string, adminId: string, companyId: string, action: 'APPROVE' | 'REJECT', comments?: string): Promise<{
        status: string;
        reason: "REQUIRED_REJECTION" | "SPECIFIC_APPROVER_OVERRIDE" | "HYBRID_RULE_SATISFIED" | "PERCENTAGE_RULE_SATISFIED" | "ALL_REQUIRED_STEPS_APPROVED" | "AWAITING_NEXT_STEP";
    }>;
    getPendingForApprover(approverId: string, companyId: string): Promise<any[]>;
    getExpenseChain(expenseId: string, companyId: string): Promise<{
        approvals: ({
            approver: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            comments: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stepOrder: number;
            isRequired: boolean;
            approverId: string;
            status: import("@prisma/client").$Enums.ApprovalStatus;
            actionedAt: Date | null;
            isConditional: boolean;
            source: import("@prisma/client").$Enums.ApprovalActionSource;
            expenseId: string;
        })[];
        template: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        amount: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        convertedAmount: import("@prisma/client-runtime-utils").Decimal | null;
        companyCurrency: string | null;
        exchangeRateUsed: import("@prisma/client-runtime-utils").Decimal | null;
        rateTimestamp: Date | null;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        description: string;
        date: Date;
        status: import("@prisma/client").$Enums.ExpenseStatus;
        receiptUrl: string | null;
        ocrExtracted: boolean;
        currentApprovalStepOrder: number | null;
        workflowMetadata: import("@prisma/client/runtime/client").JsonValue | null;
        submittedById: string;
        templateId: string | null;
        routingRuleId: string | null;
    }>;
    getExpenseTimeline(expenseId: string, companyId: string): Promise<any>;
    createTemplate(companyId: string, dto: {
        name: string;
        conditionalRuleType?: ConditionalRuleType;
        percentageThreshold?: number;
        specificApproverId?: string;
        isDefault?: boolean;
    }): Promise<{
        steps: ({
            approver: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stepOrder: number;
            roleLabel: string | null;
            isRequired: boolean;
            approverId: string;
            templateId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        conditionalRuleType: import("@prisma/client").$Enums.ConditionalRuleType;
        percentageThreshold: number | null;
        isDefault: boolean;
        specificApproverId: string | null;
    }>;
    getTemplates(companyId: string): Promise<({
        steps: ({
            approver: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stepOrder: number;
            roleLabel: string | null;
            isRequired: boolean;
            approverId: string;
            templateId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        conditionalRuleType: import("@prisma/client").$Enums.ConditionalRuleType;
        percentageThreshold: number | null;
        isDefault: boolean;
        specificApproverId: string | null;
    })[]>;
    getTemplate(id: string, companyId: string): Promise<{
        steps: ({
            approver: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stepOrder: number;
            roleLabel: string | null;
            isRequired: boolean;
            approverId: string;
            templateId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        conditionalRuleType: import("@prisma/client").$Enums.ConditionalRuleType;
        percentageThreshold: number | null;
        isDefault: boolean;
        specificApproverId: string | null;
    }>;
    updateTemplate(id: string, companyId: string, dto: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        conditionalRuleType: import("@prisma/client").$Enums.ConditionalRuleType;
        percentageThreshold: number | null;
        isDefault: boolean;
        specificApproverId: string | null;
    }>;
    deleteTemplate(id: string, companyId: string): Promise<{
        message: string;
    }>;
    addStep(templateId: string, companyId: string, dto: {
        approverId: string;
        stepOrder: number;
        roleLabel?: string;
        isRequired?: boolean;
    }): Promise<{
        approver: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stepOrder: number;
        roleLabel: string | null;
        isRequired: boolean;
        approverId: string;
        templateId: string;
    }>;
    upsertRuleConfig(templateId: string, companyId: string, dto: {
        ruleType: ConditionalRuleType;
        percentageThreshold?: number | null;
        specificApproverId?: string | null;
        requireAllRequiredApprovals?: boolean;
        allowSpecificApproverOverride?: boolean;
    }): Promise<any>;
    getRuleConfig(templateId: string, companyId: string): Promise<any>;
    deleteStep(stepId: string, companyId: string): Promise<{
        message: string;
    }>;
    createRoutingRule(companyId: string, dto: any): Promise<{
        template: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        templateId: string;
        minAmount: import("@prisma/client-runtime-utils").Decimal;
        maxAmount: import("@prisma/client-runtime-utils").Decimal | null;
        priority: number;
        isActive: boolean;
    }>;
    getRoutingRules(companyId: string): Promise<({
        template: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        templateId: string;
        minAmount: import("@prisma/client-runtime-utils").Decimal;
        maxAmount: import("@prisma/client-runtime-utils").Decimal | null;
        priority: number;
        isActive: boolean;
    })[]>;
    getRoutingRule(id: string, companyId: string): Promise<{
        template: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        templateId: string;
        minAmount: import("@prisma/client-runtime-utils").Decimal;
        maxAmount: import("@prisma/client-runtime-utils").Decimal | null;
        priority: number;
        isActive: boolean;
    }>;
    updateRoutingRule(id: string, companyId: string, dto: any): Promise<{
        template: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        templateId: string;
        minAmount: import("@prisma/client-runtime-utils").Decimal;
        maxAmount: import("@prisma/client-runtime-utils").Decimal | null;
        priority: number;
        isActive: boolean;
    }>;
    deleteRoutingRule(id: string, companyId: string): Promise<{
        message: string;
    }>;
    validateRoutingRules(companyId: string, rules: any[]): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    previewRouting(companyId: string, amount: number): Promise<{
        template: ({
            steps: ({
                approver: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                stepOrder: number;
                roleLabel: string | null;
                isRequired: boolean;
                approverId: string;
                templateId: string;
            })[];
        } & {
            id: string;
            companyId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            conditionalRuleType: import("@prisma/client").$Enums.ConditionalRuleType;
            percentageThreshold: number | null;
            isDefault: boolean;
            specificApproverId: string | null;
        }) | null;
        templateId: string;
        routingRuleId: string | null;
        amount: number;
        error?: undefined;
    } | {
        amount: number;
        error: any;
    }>;
}
