/* eslint-disable @typescript-eslint/unbound-method */
import { UpsertMyBudgetContributionUseCase } from './UpsertMyBudgetContribution.useCase';
import {
  buildBudgetMemberContribution,
  createMockBudgetGroupRepo,
  createMockBudgetMemberContributionRepo,
} from '../../../../../test/factories/budget.factory';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';

describe('UpsertMyBudgetContributionUseCase', () => {
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let contribRepo: ReturnType<typeof createMockBudgetMemberContributionRepo>;
  let useCase: UpsertMyBudgetContributionUseCase;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    contribRepo = createMockBudgetMemberContributionRepo();
    useCase = new UpsertMyBudgetContributionUseCase(groupRepo, contribRepo);
  });

  it('upsert pour le userId du command (jamais un autre)', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    contribRepo.upsertForUser.mockResolvedValueOnce(
      buildBudgetMemberContribution({ userId: 'user-1', monthlySalary: 2700 }),
    );

    const result = await useCase.execute({
      groupId: 'group-1',
      month: 5,
      year: 2026,
      monthlySalary: 2700,
      userId: 'user-1',
    });

    expect(contribRepo.upsertForUser).toHaveBeenCalledWith({
      groupId: 'group-1',
      userId: 'user-1',
      month: 5,
      year: 2026,
      monthlySalary: 2700,
    });
    expect(result.monthlySalary).toBe(2700);
  });

  it('throw InsufficientPermissionsError si user non-membre', async () => {
    groupRepo.isMember.mockResolvedValueOnce(false);

    await expect(
      useCase.execute({
        groupId: 'group-1',
        month: 5,
        year: 2026,
        monthlySalary: 2700,
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);

    expect(contribRepo.upsertForUser).not.toHaveBeenCalled();
  });

  it('propage les erreurs du repository (invariants delegues au domain/DB)', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    const dbError = new Error(
      'CHECK constraint violation: monthly_salary >= 0',
    );
    contribRepo.upsertForUser.mockRejectedValueOnce(dbError);

    await expect(
      useCase.execute({
        groupId: 'group-1',
        month: 5,
        year: 2026,
        monthlySalary: -1,
        userId: 'user-1',
      }),
    ).rejects.toThrow('CHECK constraint violation');
  });
});
