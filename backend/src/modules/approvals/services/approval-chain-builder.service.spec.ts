import { ApprovalChainBuilderService } from './approval-chain-builder.service';

describe('ApprovalChainBuilderService', () => {
  const mockPrisma: any = {
    approvalTemplate: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  };

  let service: ApprovalChainBuilderService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ApprovalChainBuilderService(mockPrisma);
  });

  it('inserts manager first and deduplicates when manager already exists in template', async () => {
    mockPrisma.approvalTemplate.findFirst.mockResolvedValue({
      id: 'tpl-1',
      steps: [
        { approverId: 'mgr-1', isRequired: true, stepOrder: 0 },
        { approverId: 'fin-1', isRequired: true, stepOrder: 1 },
      ],
    });

    mockPrisma.user.findFirst.mockResolvedValue({
      managerId: 'mgr-1',
      isManagerApprover: true,
    });

    const chain = await service.buildChain('tpl-1', 'cmp-1', 'emp-1');

    expect(chain).toHaveLength(2);
    expect(chain[0].approverId).toBe('mgr-1');
    expect(chain[0].source).toBe('MANAGER_FIRST');
    expect(chain[1].approverId).toBe('fin-1');
    expect(chain[1].stepOrder).toBe(1);
  });

  it('throws when manager-first is enabled but manager is missing', async () => {
    mockPrisma.approvalTemplate.findFirst.mockResolvedValue({
      id: 'tpl-1',
      steps: [{ approverId: 'fin-1', isRequired: true, stepOrder: 0 }],
    });

    mockPrisma.user.findFirst.mockResolvedValue({
      managerId: null,
      isManagerApprover: true,
    });

    await expect(service.buildChain('tpl-1', 'cmp-1', 'emp-1')).rejects.toThrow(
      'Manager-first approval is enabled, but employee has no manager assigned',
    );
  });
});
