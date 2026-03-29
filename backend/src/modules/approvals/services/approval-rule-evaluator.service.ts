import { Injectable } from '@nestjs/common';
import { ApprovalStatus, ConditionalRuleType } from '@prisma/client';

type RuleConfig = {
  ruleType: ConditionalRuleType;
  percentageThreshold: number | null;
  specificApproverId: string | null;
  requireAllRequiredApprovals: boolean;
  allowSpecificApproverOverride: boolean;
};

type RuntimeApproval = {
  approverId: string;
  status: ApprovalStatus;
  isRequired: boolean;
};

export type RuleDecision = {
  finalStatus: 'APPROVED' | 'REJECTED' | 'PENDING';
  reason:
    | 'REQUIRED_REJECTION'
    | 'SPECIFIC_APPROVER_OVERRIDE'
    | 'HYBRID_RULE_SATISFIED'
    | 'PERCENTAGE_RULE_SATISFIED'
    | 'ALL_REQUIRED_STEPS_APPROVED'
    | 'AWAITING_NEXT_STEP';
};

@Injectable()
export class ApprovalRuleEvaluatorService {
  evaluate(approvals: RuntimeApproval[], config: RuleConfig): RuleDecision {
    // 1) Hard rejection by required approver.
    const requiredRejected = approvals.some(
      (a) => a.isRequired && a.status === ApprovalStatus.REJECTED,
    );
    if (requiredRejected) {
      return { finalStatus: 'REJECTED', reason: 'REQUIRED_REJECTION' };
    }

    const total = approvals.length;
    const approvedCount = approvals.filter((a) => a.status === ApprovalStatus.APPROVED).length;

    const specificApproverSatisfied =
      !!config.specificApproverId &&
      approvals.some(
        (a) =>
          a.approverId === config.specificApproverId &&
          a.status === ApprovalStatus.APPROVED,
      );

    const percentageSatisfied =
      !!config.percentageThreshold &&
      total > 0 &&
      approvedCount / total >= config.percentageThreshold / 100;

    // 2) Specific approver override rule.
    const specificAllowed =
      config.ruleType === ConditionalRuleType.SPECIFIC_APPROVER ||
      config.ruleType === ConditionalRuleType.HYBRID;
    if (
      config.allowSpecificApproverOverride &&
      specificAllowed &&
      specificApproverSatisfied
    ) {
      return { finalStatus: 'APPROVED', reason: 'SPECIFIC_APPROVER_OVERRIDE' };
    }

    // 3) Hybrid rule satisfied.
    if (config.ruleType === ConditionalRuleType.HYBRID && (percentageSatisfied || specificApproverSatisfied)) {
      return { finalStatus: 'APPROVED', reason: 'HYBRID_RULE_SATISFIED' };
    }

    // 4) Percentage threshold satisfied.
    if (config.ruleType === ConditionalRuleType.PERCENTAGE && percentageSatisfied) {
      return { finalStatus: 'APPROVED', reason: 'PERCENTAGE_RULE_SATISFIED' };
    }

    // 5) Final required sequential step approved.
    const requiredPending = approvals.some(
      (a) => a.isRequired && a.status === ApprovalStatus.PENDING,
    );
    const requiredApproved = approvals
      .filter((a) => a.isRequired)
      .every((a) => a.status === ApprovalStatus.APPROVED);

    if (requiredApproved && !requiredPending) {
      return { finalStatus: 'APPROVED', reason: 'ALL_REQUIRED_STEPS_APPROVED' };
    }

    // 6) Keep pending.
    return { finalStatus: 'PENDING', reason: 'AWAITING_NEXT_STEP' };
  }
}
