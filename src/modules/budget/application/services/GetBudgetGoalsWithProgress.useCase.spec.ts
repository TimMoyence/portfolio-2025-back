/* eslint-disable @typescript-eslint/unbound-method */
import { GetBudgetGoalsWithProgressUseCase } from './GetBudgetGoalsWithProgress.useCase';
import {
  buildBudgetEntry,
  buildBudgetGoal,
  createMockBudgetEntryRepo,
  createMockBudgetGoalRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';

describe('GetBudgetGoalsWithProgressUseCase', () => {
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let goalRepo: ReturnType<typeof createMockBudgetGoalRepo>;
  let entryRepo: ReturnType<typeof createMockBudgetEntryRepo>;
  let useCase: GetBudgetGoalsWithProgressUseCase;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    goalRepo = createMockBudgetGoalRepo();
    entryRepo = createMockBudgetEntryRepo();
    useCase = new GetBudgetGoalsWithProgressUseCase(
      groupRepo,
      goalRepo,
      entryRepo,
    );
  });

  it('throw InsufficientPermissionsError si user non-membre', async () => {
    groupRepo.isMember.mockResolvedValueOnce(false);
    await expect(
      useCase.execute({ groupId: 'g1', userId: 'u1', month: 5, year: 2026 }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);
    expect(goalRepo.findByGroupId).not.toHaveBeenCalled();
  });

  it('SAVINGS : currentAmount = somme des entries VARIABLE avec amount > 0 (mois courant)', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.findByGroupId.mockResolvedValueOnce([
      buildBudgetGoal({
        id: 'goal-savings',
        kind: 'SAVINGS',
        targetAmount: 1000,
        categoryId: null,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValueOnce([
      buildBudgetEntry({ id: 'e1', type: 'VARIABLE', amount: 500 }),
      buildBudgetEntry({ id: 'e2', type: 'VARIABLE', amount: 200 }),
      buildBudgetEntry({ id: 'e3', type: 'VARIABLE', amount: -50 }),
      buildBudgetEntry({ id: 'e4', type: 'FIXED', amount: 100 }),
    ]);

    const result = await useCase.execute({
      groupId: 'g1',
      userId: 'u1',
      month: 5,
      year: 2026,
    });

    expect(entryRepo.findByFilters).toHaveBeenCalledWith({
      groupId: 'g1',
      month: 5,
      year: 2026,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('goal-savings');
    expect(result[0].currentAmount).toBe(700);
    expect(result[0].progressPercent).toBe(70);
  });

  it('SPENDING_LIMIT : currentAmount = abs(somme des entries amount < 0)', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.findByGroupId.mockResolvedValueOnce([
      buildBudgetGoal({
        id: 'goal-limit',
        kind: 'SPENDING_LIMIT',
        targetAmount: 1000,
        categoryId: null,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValueOnce([
      buildBudgetEntry({ amount: -300 }),
      buildBudgetEntry({ amount: -200 }),
      buildBudgetEntry({ amount: 500 }),
    ]);

    const result = await useCase.execute({
      groupId: 'g1',
      userId: 'u1',
      month: 5,
      year: 2026,
    });
    expect(result[0].currentAmount).toBe(500);
    expect(result[0].progressPercent).toBe(50);
  });

  it('CATEGORY_LIMIT : currentAmount = abs(somme entries categoryId match)', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.findByGroupId.mockResolvedValueOnce([
      buildBudgetGoal({
        id: 'goal-cat',
        kind: 'CATEGORY_LIMIT',
        targetAmount: 600,
        categoryId: 'cat-courses',
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValueOnce([
      buildBudgetEntry({ amount: -150, categoryId: 'cat-courses' }),
      buildBudgetEntry({ amount: -100, categoryId: 'cat-courses' }),
      buildBudgetEntry({ amount: -200, categoryId: 'cat-loyer' }),
      buildBudgetEntry({ amount: -50, categoryId: null }),
    ]);
    const result = await useCase.execute({
      groupId: 'g1',
      userId: 'u1',
      month: 5,
      year: 2026,
    });
    expect(result[0].currentAmount).toBe(250);
    // withProgress du domain ne fait pas d'arrondi (Math.max/min only) : 250/600*100 = 41.6666...
    expect(result[0].progressPercent).toBeCloseTo(41.6667, 3);
  });

  it('clamp progressPercent dans [0, 100]', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.findByGroupId.mockResolvedValueOnce([
      buildBudgetGoal({
        id: 'goal-overshoot',
        kind: 'SAVINGS',
        targetAmount: 100,
        categoryId: null,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValueOnce([
      buildBudgetEntry({ type: 'VARIABLE', amount: 500 }),
    ]);
    const result = await useCase.execute({
      groupId: 'g1',
      userId: 'u1',
      month: 5,
      year: 2026,
    });
    expect(result[0].progressPercent).toBe(100);
    expect(result[0].currentAmount).toBe(500);
  });

  it('retourne [] si aucun goal pour le groupe', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.findByGroupId.mockResolvedValueOnce([]);
    const result = await useCase.execute({
      groupId: 'g1',
      userId: 'u1',
      month: 5,
      year: 2026,
    });
    expect(result).toEqual([]);
    expect(entryRepo.findByFilters).not.toHaveBeenCalled();
  });

  it('1 seul fetch entries pour multiples goals (pas de N+1)', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.findByGroupId.mockResolvedValueOnce([
      buildBudgetGoal({ id: 'g-1', kind: 'SAVINGS', targetAmount: 100 }),
      buildBudgetGoal({
        id: 'g-2',
        kind: 'SPENDING_LIMIT',
        targetAmount: 200,
      }),
      buildBudgetGoal({
        id: 'g-3',
        kind: 'CATEGORY_LIMIT',
        categoryId: 'cat-1',
        targetAmount: 50,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValueOnce([]);

    await useCase.execute({
      groupId: 'g1',
      userId: 'u1',
      month: 5,
      year: 2026,
    });

    expect(entryRepo.findByFilters).toHaveBeenCalledTimes(1);
  });
});
