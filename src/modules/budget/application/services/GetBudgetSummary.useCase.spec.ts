import { ForbiddenException } from '@nestjs/common';
import { GetBudgetSummaryUseCase } from './GetBudgetSummary.useCase';
import {
  createMockBudgetEntryRepo,
  createMockBudgetGroupRepo,
  createMockBudgetCategoryRepo,
  buildBudgetEntry,
  buildBudgetCategory,
} from '../../../../../test/factories/budget.factory';

describe('GetBudgetSummaryUseCase', () => {
  let useCase: GetBudgetSummaryUseCase;
  let entryRepo: ReturnType<typeof createMockBudgetEntryRepo>;
  let categoryRepo: ReturnType<typeof createMockBudgetCategoryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  const defaultParams = {
    userId: 'user-1',
    groupId: 'group-1',
    month: 3,
    year: 2026,
  };

  beforeEach(() => {
    entryRepo = createMockBudgetEntryRepo();
    categoryRepo = createMockBudgetCategoryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new GetBudgetSummaryUseCase(entryRepo, categoryRepo, groupRepo);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(useCase.execute(defaultParams)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('devrait calculer le resume avec depenses et revenus', async () => {
    const expense = buildBudgetEntry({ amount: -100, categoryId: 'cat-1' });
    const income = buildBudgetEntry({
      id: 'entry-2',
      amount: 500,
      categoryId: 'cat-2',
    });
    const category = buildBudgetCategory({
      id: 'cat-1',
      name: 'Courses',
      budgetLimit: 300,
    });

    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue([expense, income]);
    categoryRepo.findByGroupId.mockResolvedValue([category]);

    const result = await useCase.execute(defaultParams);

    expect(result.totalExpenses).toBeCloseTo(100);
    expect(result.totalIncoming).toBeCloseTo(500);
  });

  it('devrait calculer le remaining par categorie', async () => {
    const category = buildBudgetCategory({
      id: 'cat-1',
      name: 'Courses',
      budgetLimit: 600,
    });
    const entry = buildBudgetEntry({ amount: -400, categoryId: 'cat-1' });

    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue([entry]);
    categoryRepo.findByGroupId.mockResolvedValue([category]);

    const result = await useCase.execute(defaultParams);

    const categorySummary = result.byCategory.find(
      (c) => c.categoryId === 'cat-1',
    );
    expect(categorySummary).toBeDefined();
    expect(categorySummary!.total).toBeCloseTo(400);
    expect(categorySummary!.budgetLimit).toBe(600);
    expect(categorySummary!.remaining).toBeCloseTo(200);
  });

  it('devrait retourner Sans categorie pour les entrees sans categoryId', async () => {
    const entry = buildBudgetEntry({
      amount: -50,
      categoryId: null as unknown as string,
    });

    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue([entry]);
    categoryRepo.findByGroupId.mockResolvedValue([]);

    const result = await useCase.execute(defaultParams);

    const uncategorized = result.byCategory.find((c) => c.categoryId === null);
    expect(uncategorized).toBeDefined();
    expect(uncategorized!.categoryName).toBe('Sans categorie');
    expect(uncategorized!.total).toBeCloseTo(50);
  });

  it('devrait retourner un resume vide quand aucune entree', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue([]);
    categoryRepo.findByGroupId.mockResolvedValue([]);

    const result = await useCase.execute(defaultParams);

    expect(result.totalExpenses).toBe(0);
    expect(result.totalIncoming).toBe(0);
    expect(result.byCategory).toHaveLength(0);
  });
});
