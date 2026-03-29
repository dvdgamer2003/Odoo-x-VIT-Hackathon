import { ApprovalStatus, ConditionalRuleType } from '@prisma/client';
import { ApprovalRuleEvaluatorService } from './approval-rule-evaluator.service';

describe('ApprovalRuleEvaluatorService', () => {
  let service: ApprovalRuleEvaluatorService;

  beforeEach(() => {
    service = new ApprovalRuleEvaluatorService();
  });

  it('rejects immediately when a required approver rejects', () => {
    const decision = service.evaluate(
      [
        { approverId: 'a1', status: ApprovalStatus.REJECTED, isRequired: true },
        { approverId: 'a2', status: ApprovalStatus.PENDING, isRequired: true },
      ],
      {
        ruleType: ConditionalRuleType.HYBRID,
        percentageThreshold: 60,
        specificApproverId: 'a3',
        requireAllRequiredApprovals: true,
        allowSpecificApproverOverride: true,
      },
    );

    expect(decision).toEqual({
      finalStatus: 'REJECTED',
      reason: 'REQUIRED_REJECTION',
    });
  });

  it('approves when specific approver override is satisfied', () => {
    const decision = service.evaluate(
      [
        { approverId: 'cfo', status: ApprovalStatus.APPROVED, isRequired: false },
        { approverId: 'mgr', status: ApprovalStatus.PENDING, isRequired: true },
      ],
      {
        ruleType: ConditionalRuleType.SPECIFIC_APPROVER,
        percentageThreshold: null,
        specificApproverId: 'cfo',
        requireAllRequiredApprovals: false,
        allowSpecificApproverOverride: true,
      },
    );

    expect(decision.finalStatus).toBe('APPROVED');
    expect(decision.reason).toBe('SPECIFIC_APPROVER_OVERRIDE');
  });

  it('approves when percentage threshold is satisfied', () => {
    const decision = service.evaluate(
      [
        { approverId: 'a1', status: ApprovalStatus.APPROVED, isRequired: true },
        { approverId: 'a2', status: ApprovalStatus.APPROVED, isRequired: false },
        { approverId: 'a3', status: ApprovalStatus.PENDING, isRequired: false },
      ],
      {
        ruleType: ConditionalRuleType.PERCENTAGE,
        percentageThreshold: 60,
        specificApproverId: null,
        requireAllRequiredApprovals: true,
        allowSpecificApproverOverride: true,
      },
    );

    expect(decision).toEqual({
      finalStatus: 'APPROVED',
      reason: 'PERCENTAGE_RULE_SATISFIED',
    });
  });

  it('keeps pending when no completion conditions are met', () => {
    const decision = service.evaluate(
      [
        { approverId: 'a1', status: ApprovalStatus.APPROVED, isRequired: true },
        { approverId: 'a2', status: ApprovalStatus.PENDING, isRequired: true },
      ],
      {
        ruleType: ConditionalRuleType.NONE,
        percentageThreshold: null,
        specificApproverId: null,
        requireAllRequiredApprovals: true,
        allowSpecificApproverOverride: true,
      },
    );

    expect(decision).toEqual({
      finalStatus: 'PENDING',
      reason: 'AWAITING_NEXT_STEP',
    });
  });
});
