import { PrismaService } from '../../prisma/prisma.service';
import { CurrencyService } from '../../currency/services/currency.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { ExpenseStatus, Role } from '@prisma/client';
export declare class ExpensesService {
    private prisma;
    private currencyService;
    private readonly logger;
    constructor(prisma: PrismaService, currencyService: CurrencyService);
    create(submittedById: string, companyId: string, dto: CreateExpenseDto, approvalsService: any): Promise<{
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
        routingRule: {
            id: string;
            minAmount: import("@prisma/client-runtime-utils").Decimal;
            maxAmount: import("@prisma/client-runtime-utils").Decimal | null;
            priority: number;
        } | null;
        submittedBy: {
            id: string;
            name: string;
            email: string;
        };
        template: {
            id: string;
            name: string;
        } | null;
        ocrJob: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.OcrJobStatus;
            expenseId: string;
            rawResponse: import("@prisma/client/runtime/client").JsonValue | null;
            parsedData: import("@prisma/client/runtime/client").JsonValue | null;
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
    findAll(companyId: string, userId: string, role: Role, query: {
        status?: ExpenseStatus;
        category?: string;
        page?: number;
        limit?: number;
    }): Promise<import("../../../common/utils/pagination.util").PaginatedResult<{
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
        submittedBy: {
            id: string;
            name: string;
            email: string;
        };
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
    }>>;
    findOne(id: string, companyId: string, userId: string, role: string): Promise<{
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
        routingRule: {
            id: string;
            minAmount: import("@prisma/client-runtime-utils").Decimal;
            maxAmount: import("@prisma/client-runtime-utils").Decimal | null;
            priority: number;
        } | null;
        submittedBy: {
            id: string;
            name: string;
            email: string;
        };
        template: {
            id: string;
            name: string;
        } | null;
        ocrJob: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.OcrJobStatus;
            expenseId: string;
            rawResponse: import("@prisma/client/runtime/client").JsonValue | null;
            parsedData: import("@prisma/client/runtime/client").JsonValue | null;
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
    cancel(id: string, userId: string, companyId: string): Promise<{
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
    getStats(companyId: string): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        cancelled: number;
        totalApprovedAmount: number | import("@prisma/client-runtime-utils").Decimal;
    }>;
}
