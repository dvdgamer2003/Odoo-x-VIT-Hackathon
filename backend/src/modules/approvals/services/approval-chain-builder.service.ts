import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ApprovalActionSourceValue = 'TEMPLATE' | 'MANAGER_FIRST' | 'ADMIN_OVERRIDE';

type RuntimeChainStep = {
  approverId: string;
  stepOrder: number;
  isRequired: boolean;
  isConditional: boolean;
  source: ApprovalActionSourceValue;
};

@Injectable()
export class ApprovalChainBuilderService {
  constructor(private prisma: PrismaService) {}

  async buildChain(
    templateId: string,
    companyId: string,
    submittedById: string,
  ): Promise<RuntimeChainStep[]> {
    const prismaAny = this.prisma as any;

    const template = await prismaAny.approvalTemplate.findFirst({
      where: { id: templateId, companyId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          select: {
            approverId: true,
            isRequired: true,
            stepOrder: true,
          },
        },
      },
    });

    if (!template) throw new NotFoundException('Approval template not found');

    const submitter = await this.prisma.user.findFirst({
      where: { id: submittedById, companyId },
      select: { managerId: true, isManagerApprover: true },
    });
    if (!submitter) throw new NotFoundException('Employee not found');

    const rawChain: RuntimeChainStep[] = [];

    // Insert manager-first if configured.
    if (submitter.isManagerApprover) {
      if (!submitter.managerId) {
        throw new BadRequestException(
          'Manager-first approval is enabled, but employee has no manager assigned',
        );
      }

      rawChain.push({
        approverId: submitter.managerId,
        stepOrder: 0,
        isRequired: true,
        isConditional: false,
        source: 'MANAGER_FIRST',
      });
    }

    for (const step of template.steps as any[]) {
      rawChain.push({
        approverId: step.approverId,
        stepOrder: step.stepOrder,
        isRequired: typeof step.isRequired === 'boolean' ? step.isRequired : true,
        isConditional: typeof step.isRequired === 'boolean' ? !step.isRequired : false,
        source: 'TEMPLATE',
      });
    }

    // Deduplicate approvers while preserving first occurrence order.
    const deduped: RuntimeChainStep[] = [];
    const seen = new Set<string>();
    for (const step of rawChain.sort((a, b) => a.stepOrder - b.stepOrder)) {
      if (seen.has(step.approverId)) continue;
      seen.add(step.approverId);
      deduped.push(step);
    }

    return deduped.map((step, idx) => ({
      ...step,
      stepOrder: idx,
    }));
  }

  toCreateInputs(expenseId: string, chain: RuntimeChainStep[]): Prisma.ExpenseApprovalCreateManyInput[] {
    return chain.map((step) => ({
      expenseId,
      approverId: step.approverId,
      stepOrder: step.stepOrder,
      status: 'PENDING',
      ...( { isRequired: step.isRequired, isConditional: step.isConditional, source: step.source } as any),
    })) as Prisma.ExpenseApprovalCreateManyInput[];
  }
}
