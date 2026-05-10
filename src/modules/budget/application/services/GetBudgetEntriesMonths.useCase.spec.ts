/* eslint-disable @typescript-eslint/unbound-method */
import { GetBudgetEntriesMonthsUseCase } from './GetBudgetEntriesMonths.useCase';
import {
  createMockBudgetEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';

describe('GetBudgetEntriesMonthsUseCase', () => {
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let entryRepo: ReturnType<typeof createMockBudgetEntryRepo>;
  let useCase: GetBudgetEntriesMonthsUseCase;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    entryRepo = createMockBudgetEntryRepo();
    useCase = new GetBudgetEntriesMonthsUseCase(groupRepo, entryRepo);
  });

  it('retourne la liste des couples (month, year) si user est member', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    entryRepo.findDistinctMonths.mockResolvedValueOnce([
      { month: 5, year: 2026 },
      { month: 4, year: 2026 },
      { month: 12, year: 2025 },
    ]);

    const result = await useCase.execute({ groupId: 'g1', userId: 'u1' });

    expect(groupRepo.isMember).toHaveBeenCalledWith('g1', 'u1');
    expect(entryRepo.findDistinctMonths).toHaveBeenCalledWith('g1');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ month: 5, year: 2026 });
  });

  it('retourne [] si aucune entree pour le groupe', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    entryRepo.findDistinctMonths.mockResolvedValueOnce([]);
    const result = await useCase.execute({ groupId: 'g1', userId: 'u1' });
    expect(result).toEqual([]);
  });

  it('throw InsufficientPermissionsError si user non-membre', async () => {
    groupRepo.isMember.mockResolvedValueOnce(false);
    await expect(
      useCase.execute({ groupId: 'g1', userId: 'outsider' }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);
    expect(entryRepo.findDistinctMonths).not.toHaveBeenCalled();
  });
});
