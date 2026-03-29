import { PrismaService } from '../../prisma/prisma.service';
import { TemplateRoutingService } from './template-routing.service';
import { ApprovalChainBuilderService } from './approval-chain-builder.service';
import { ApprovalRuleEvaluatorService } from './approval-rule-evaluator.service';
import { ApprovalAuditService } from './approval-audit.service';
export declare class ApprovalEngineService {
    private prisma;
    private routingService;
    private chainBuilder;
    private ruleEvaluator;
    private auditService;
    private readonly logger;
    constructor(prisma: PrismaService, routingService: TemplateRoutingService, chainBuilder: ApprovalChainBuilderService, ruleEvaluator: ApprovalRuleEvaluatorService, auditService: ApprovalAuditService);
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
    private processAction;
    private validateApproverAction;
    private getApproverContext;
    private getRuleConfig;
    private buildActionComments;
    private getCurrentStep;
    private finalizeExpense;
}
