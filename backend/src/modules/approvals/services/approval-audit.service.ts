import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ApprovalAuditEventTypeValue =
  | 'TEMPLATE_SELECTED'
  | 'CHAIN_GENERATED'
  | 'STEP_APPROVED'
  | 'STEP_REJECTED'
  | 'RULE_AUTO_APPROVED'
  | 'ADMIN_OVERRIDE'
  | 'FINALIZED';

@Injectable()
export class ApprovalAuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    expenseId: string,
    eventType: ApprovalAuditEventTypeValue,
    payload?: Record<string, unknown>,
    actorId?: string,
  ) {
    const prismaAny = this.prisma as any;
    return prismaAny.approvalAuditLog.create({
      data: {
        expenseId,
        actorId: actorId ?? null,
        eventType,
        payload: (payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async getTimeline(expenseId: string, companyId: string) {
    const prismaAny = this.prisma as any;
    return prismaAny.approvalAuditLog.findMany({
      where: { expenseId, expense: { companyId } },
      orderBy: { createdAt: 'asc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
