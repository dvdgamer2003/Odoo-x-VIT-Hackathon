import { PrismaService } from '../../prisma/prisma.service';
export declare class TemplateRoutingService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    selectTemplate(companyId: string, convertedAmount: number): Promise<{
        templateId: string;
        routingRuleId: string | null;
    }>;
    createRule(companyId: string, dto: {
        templateId: string;
        minAmount: number;
        maxAmount?: number;
        priority?: number;
        isActive?: boolean;
    }): Promise<{
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
    findAll(companyId: string): Promise<({
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
    findOne(id: string, companyId: string): Promise<{
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
    updateRule(id: string, companyId: string, dto: {
        minAmount?: number;
        maxAmount?: number | null;
        priority?: number;
        isActive?: boolean;
        templateId?: string;
    }): Promise<{
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
    deleteRule(id: string, companyId: string): Promise<{
        message: string;
    }>;
    preview(companyId: string, amount: number): Promise<{
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
                isRequired: boolean;
                roleLabel: string | null;
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
    validateOverlapDryRun(companyId: string, rules: Array<{
        minAmount: number;
        maxAmount?: number;
        priority: number;
    }>): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    private validateNoOverlap;
    private ensureCompanyHasActiveRouteOrDefault;
}
