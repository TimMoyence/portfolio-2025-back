import type { Request } from 'express';
import { BudgetController } from './Budget.controller';
import type { CreateBudgetGroupUseCase } from '../application/services/CreateBudgetGroup.useCase';
import type { GetBudgetGroupsUseCase } from '../application/services/GetBudgetGroups.useCase';
import type { CreateBudgetEntryUseCase } from '../application/services/CreateBudgetEntry.useCase';
import type { GetBudgetEntriesUseCase } from '../application/services/GetBudgetEntries.useCase';
import type { GetBudgetSummaryUseCase } from '../application/services/GetBudgetSummary.useCase';
import type { ImportBudgetEntriesUseCase } from '../application/services/ImportBudgetEntries.useCase';
import type { UpdateBudgetEntryUseCase } from '../application/services/UpdateBudgetEntry.useCase';
import type { DeleteBudgetEntryUseCase } from '../application/services/DeleteBudgetEntry.useCase';
import type { CreateBudgetCategoryUseCase } from '../application/services/CreateBudgetCategory.useCase';
import type { GetBudgetCategoriesUseCase } from '../application/services/GetBudgetCategories.useCase';
import type { UpdateBudgetCategoryUseCase } from '../application/services/UpdateBudgetCategory.useCase';
import type { ShareBudgetUseCase } from '../application/services/ShareBudget.useCase';
import {
  buildBudgetGroup,
  buildBudgetEntry,
  buildBudgetCategory,
} from '../../../../test/factories/budget.factory';
import {
  createMockBudgetUseCases,
  type MockBudgetUseCases,
} from '../../../../test/factories/budget.factory';

describe('BudgetController', () => {
  let controller: BudgetController;
  let useCases: MockBudgetUseCases;

  const mockReq = { user: { sub: 'user-1' } } as unknown as Request;

  beforeEach(() => {
    useCases = createMockBudgetUseCases();

    controller = new BudgetController(
      useCases.createGroup as unknown as CreateBudgetGroupUseCase,
      useCases.getGroups as unknown as GetBudgetGroupsUseCase,
      useCases.createEntry as unknown as CreateBudgetEntryUseCase,
      useCases.getEntries as unknown as GetBudgetEntriesUseCase,
      useCases.getSummary as unknown as GetBudgetSummaryUseCase,
      useCases.importEntries as unknown as ImportBudgetEntriesUseCase,
      useCases.updateEntry as unknown as UpdateBudgetEntryUseCase,
      useCases.createCategory as unknown as CreateBudgetCategoryUseCase,
      useCases.getCategories as unknown as GetBudgetCategoriesUseCase,
      useCases.deleteEntry as unknown as DeleteBudgetEntryUseCase,
      useCases.updateCategory as unknown as UpdateBudgetCategoryUseCase,
      useCases.shareBudget as unknown as ShareBudgetUseCase,
    );
  });

  // --- createBudgetGroup ---

  it('devrait deleguer createBudgetGroup au use case et mapper la reponse', async () => {
    const group = buildBudgetGroup();
    useCases.createGroup.execute.mockResolvedValue(group);

    const result = await controller.createBudgetGroup(
      { name: 'Budget couple T&M' },
      mockReq,
    );

    expect(useCases.createGroup.execute).toHaveBeenCalledWith({
      name: 'Budget couple T&M',
      userId: 'user-1',
    });
    expect(result.id).toBe(group.id);
    expect(result.name).toBe(group.name);
    expect(result.ownerId).toBe(group.ownerId);
  });

  it('devrait extraire le userId du JWT pour createBudgetGroup', async () => {
    const customReq = { user: { sub: 'user-42' } } as unknown as Request;
    useCases.createGroup.execute.mockResolvedValue(buildBudgetGroup());

    await controller.createBudgetGroup({ name: 'Mon budget' }, customReq);

    expect(useCases.createGroup.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-42' }),
    );
  });

  // --- listBudgetGroups ---

  it('devrait deleguer listBudgetGroups au use case', async () => {
    const groups = [buildBudgetGroup(), buildBudgetGroup({ id: 'group-2' })];
    useCases.getGroups.execute.mockResolvedValue(groups);

    const result = await controller.listBudgetGroups(mockReq);

    expect(useCases.getGroups.execute).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('group-1');
    expect(result[1].id).toBe('group-2');
  });

  // --- createBudgetEntry ---

  it('devrait deleguer createBudgetEntry au use case et mapper la reponse', async () => {
    const entry = buildBudgetEntry();
    useCases.createEntry.execute.mockResolvedValue(entry);

    const dto = {
      groupId: 'group-1',
      categoryId: 'cat-1',
      date: '2026-03-15',
      description: 'Carrefour courses',
      amount: -85.5,
      type: 'VARIABLE' as const,
      state: 'COMPLETED' as const,
    };

    const result = await controller.createBudgetEntry(dto, mockReq);

    expect(useCases.createEntry.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'group-1',
      categoryId: 'cat-1',
      date: '2026-03-15',
      description: 'Carrefour courses',
      amount: -85.5,
      type: 'VARIABLE',
      state: 'COMPLETED',
    });
    expect(result.id).toBe(entry.id);
    expect(result.amount).toBe(-85.5);
  });

  // --- updateBudgetEntry ---

  it('devrait deleguer updateBudgetEntry avec entryId et categoryId', async () => {
    const entry = buildBudgetEntry({ categoryId: 'cat-2' });
    useCases.updateEntry.execute.mockResolvedValue(entry);

    const result = await controller.updateBudgetEntry(
      'entry-1',
      { categoryId: 'cat-2' },
      mockReq,
    );

    expect(useCases.updateEntry.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      entryId: 'entry-1',
      categoryId: 'cat-2',
    });
    expect(result.categoryId).toBe('cat-2');
  });

  // --- listBudgetEntries ---

  it('devrait deleguer listBudgetEntries avec les filtres', async () => {
    const entries = [buildBudgetEntry()];
    useCases.getEntries.execute.mockResolvedValue(entries);

    const result = await controller.listBudgetEntries(
      'group-1',
      '3',
      '2026',
      'cat-1',
      mockReq,
    );

    expect(useCases.getEntries.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
      categoryId: 'cat-1',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('entry-1');
  });

  it('devrait passer undefined pour month/year si non fournis', async () => {
    useCases.getEntries.execute.mockResolvedValue([]);

    await controller.listBudgetEntries(
      'group-1',
      undefined,
      undefined,
      undefined,
      mockReq,
    );

    expect(useCases.getEntries.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'group-1',
      month: undefined,
      year: undefined,
      categoryId: undefined,
    });
  });

  // --- budgetSummary ---

  it('devrait deleguer budgetSummary au use case', async () => {
    const summary = {
      totalExpenses: 500,
      totalIncoming: 2000,
      byCategory: [],
    };
    useCases.getSummary.execute.mockResolvedValue(summary);

    const result = await controller.budgetSummary(
      'group-1',
      '3',
      '2026',
      mockReq,
    );

    expect(useCases.getSummary.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });
    expect(result.totalExpenses).toBe(500);
    expect(result.totalIncoming).toBe(2000);
  });

  // --- importBudgetEntries ---

  it('devrait deleguer importBudgetEntries au use case', async () => {
    const entries = [buildBudgetEntry(), buildBudgetEntry({ id: 'entry-2' })];
    useCases.importEntries.execute.mockResolvedValue(entries);

    const result = await controller.importBudgetEntries(
      { groupId: 'group-1', csvContent: 'date;montant\n2026-03-15;-50' },
      mockReq,
    );

    expect(useCases.importEntries.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'group-1',
      csvContent: 'date;montant\n2026-03-15;-50',
    });
    expect(result).toHaveLength(2);
  });

  // --- createBudgetCategory ---

  it('devrait deleguer createBudgetCategory au use case et mapper la reponse', async () => {
    const category = buildBudgetCategory();
    useCases.createCategory.execute.mockResolvedValue(category);

    const dto = {
      groupId: 'group-1',
      name: 'Courses',
      color: '#22C55E',
      icon: 'shopping-cart',
      budgetType: 'VARIABLE' as const,
      budgetLimit: 600,
    };

    const result = await controller.createBudgetCategory(dto, mockReq);

    expect(useCases.createCategory.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'group-1',
      name: 'Courses',
      color: '#22C55E',
      icon: 'shopping-cart',
      budgetType: 'VARIABLE',
      budgetLimit: 600,
    });
    expect(result.id).toBe(category.id);
    expect(result.name).toBe('Courses');
  });

  // --- listBudgetCategories ---

  it('devrait deleguer listBudgetCategories au use case', async () => {
    const categories = [buildBudgetCategory()];
    useCases.getCategories.execute.mockResolvedValue(categories);

    const result = await controller.listBudgetCategories('group-1', mockReq);

    expect(useCases.getCategories.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'group-1',
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Courses');
  });

  // --- deleteBudgetEntry ---

  it('devrait deleguer deleteBudgetEntry au use case', async () => {
    useCases.deleteEntry.execute.mockResolvedValue(undefined);

    await controller.deleteBudgetEntry('entry-1', mockReq);

    expect(useCases.deleteEntry.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      entryId: 'entry-1',
    });
  });

  // --- updateBudgetCategory ---

  it('devrait deleguer updateBudgetCategory au use case et mapper la reponse', async () => {
    const category = buildBudgetCategory({ name: 'Alimentation' });
    useCases.updateCategory.execute.mockResolvedValue(category);

    const dto = {
      name: 'Alimentation',
      color: '#FF0000',
      icon: 'utensils',
      budgetType: 'VARIABLE' as const,
      budgetLimit: 800,
    };

    const result = await controller.updateBudgetCategory('cat-1', dto, mockReq);

    expect(useCases.updateCategory.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      categoryId: 'cat-1',
      name: 'Alimentation',
      color: '#FF0000',
      icon: 'utensils',
      budgetType: 'VARIABLE',
      budgetLimit: 800,
    });
    expect(result.name).toBe('Alimentation');
  });

  // --- shareBudgetGroup ---

  it('devrait deleguer shareBudgetGroup au use case', async () => {
    const shareResult = { shared: true as const, userId: 'user-2' };
    useCases.shareBudget.execute.mockResolvedValue(shareResult);

    const result = await controller.shareBudgetGroup(
      { groupId: 'group-1', targetEmail: 'partner@example.com' },
      mockReq,
    );

    expect(useCases.shareBudget.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'group-1',
      targetEmail: 'partner@example.com',
    });
    expect(result).toEqual(shareResult);
  });

  // --- Propagation d'erreurs ---

  it('devrait propager InsufficientPermissionsError du use case', async () => {
    const error = new Error('User is not a member of this budget group');
    error.name = 'InsufficientPermissionsError';
    useCases.getSummary.execute.mockRejectedValue(error);

    await expect(
      controller.budgetSummary('group-1', '3', '2026', mockReq),
    ).rejects.toThrow('User is not a member of this budget group');
  });

  it('devrait propager ResourceNotFoundError du use case', async () => {
    const error = new Error('Entry not found');
    error.name = 'ResourceNotFoundError';
    useCases.updateEntry.execute.mockRejectedValue(error);

    await expect(
      controller.updateBudgetEntry(
        'entry-999',
        { categoryId: 'cat-1' },
        mockReq,
      ),
    ).rejects.toThrow('Entry not found');
  });
});
