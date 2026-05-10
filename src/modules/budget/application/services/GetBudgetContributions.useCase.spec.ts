/* eslint-disable @typescript-eslint/unbound-method */
import { GetBudgetContributionsUseCase } from './GetBudgetContributions.useCase';
import {
  buildBudgetMemberContribution,
  createMockBudgetGroupRepo,
  createMockBudgetMemberContributionRepo,
} from '../../../../../test/factories/budget.factory';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';

describe('GetBudgetContributionsUseCase', () => {
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let contribRepo: ReturnType<typeof createMockBudgetMemberContributionRepo>;
  let useCase: GetBudgetContributionsUseCase;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    contribRepo = createMockBudgetMemberContributionRepo();
    useCase = new GetBudgetContributionsUseCase(groupRepo, contribRepo);
  });

  it('retourne les contributions si user est membre', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    contribRepo.findByGroupAndPeriod.mockResolvedValueOnce([
      buildBudgetMemberContribution({ userId: 'user-1', monthlySalary: 2500 }),
      buildBudgetMemberContribution({
        id: 'contrib-2',
        userId: 'user-2',
        monthlySalary: 1800,
      }),
    ]);

    const result = await useCase.execute({
      groupId: 'group-1',
      month: 5,
      year: 2026,
      userId: 'user-1',
    });

    expect(groupRepo.isMember).toHaveBeenCalledWith('group-1', 'user-1');
    expect(contribRepo.findByGroupAndPeriod).toHaveBeenCalledWith(
      'group-1',
      5,
      2026,
    );
    expect(result).toHaveLength(2);
  });

  it('throw InsufficientPermissionsError si user non-membre', async () => {
    groupRepo.isMember.mockResolvedValueOnce(false);

    await expect(
      useCase.execute({
        groupId: 'group-1',
        month: 5,
        year: 2026,
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);

    expect(contribRepo.findByGroupAndPeriod).not.toHaveBeenCalled();
  });

  it('retourne [] si aucune contribution pour la periode', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    contribRepo.findByGroupAndPeriod.mockResolvedValueOnce([]);

    const result = await useCase.execute({
      groupId: 'group-1',
      month: 12,
      year: 2026,
      userId: 'user-1',
    });

    expect(result).toEqual([]);
  });
});
