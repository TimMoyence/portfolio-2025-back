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
import type { GetBudgetGroupMembersUseCase } from '../application/services/GetBudgetGroupMembers.useCase';
import type { RemoveBudgetGroupMemberUseCase } from '../application/services/RemoveBudgetGroupMember.useCase';
import type { GetBudgetEntriesMonthsUseCase } from '../application/services/GetBudgetEntriesMonths.useCase';
import type { ListPendingInvitationsUseCase } from '../application/services/ListPendingInvitations.useCase';
import { InsufficientPermissionsError } from '../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import {
  buildBudgetGroup,
  buildBudgetEntry,
  buildBudgetCategory,
  buildBudgetMember,
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
      useCases.getMembers as unknown as GetBudgetGroupMembersUseCase,
      useCases.removeMember as unknown as RemoveBudgetGroupMemberUseCase,
      useCases.getEntriesMonths as unknown as GetBudgetEntriesMonthsUseCase,
      useCases.listPendingInvitations as unknown as ListPendingInvitationsUseCase,
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
      groupId: undefined,
    });
    expect(result.name).toBe('Alimentation');
  });

  it('devrait propager groupId au use case (auto-clone defaut)', async () => {
    const category = buildBudgetCategory({ name: 'Alimentation' });
    useCases.updateCategory.execute.mockResolvedValue(category);

    const dto = {
      budgetLimit: 600,
      groupId: 'group-42',
    };

    await controller.updateBudgetCategory('cat-default', dto, mockReq);

    expect(useCases.updateCategory.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      categoryId: 'cat-default',
      name: undefined,
      color: undefined,
      icon: undefined,
      budgetType: undefined,
      budgetLimit: 600,
      groupId: 'group-42',
    });
  });

  // --- shareBudgetGroup ---
  // Test precedent (pre P0-1) retire : il assertait `userId: 'user-2'`
  // dans le mock de retour du use case ; le contrat ne l'expose plus.

  it('devrait deleguer shareBudgetGroup au use case et propager le retour shared', async () => {
    const shareResult = { status: 'shared' as const };
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
    expect(result).toEqual({ status: 'shared' });
    expect(result).not.toHaveProperty('userId');
  });

  it('devrait propager le statut already-member depuis shareBudget', async () => {
    useCases.shareBudget.execute.mockResolvedValue({
      status: 'already-member',
    });

    const result = await controller.shareBudgetGroup(
      { groupId: 'group-1', targetEmail: 'partner@example.com' },
      mockReq,
    );

    expect(result).toEqual({ status: 'already-member' });
  });

  it('devrait propager le statut invited depuis shareBudget (magic-link)', async () => {
    useCases.shareBudget.execute.mockResolvedValue({ status: 'invited' });

    const result = await controller.shareBudgetGroup(
      { groupId: 'group-1', targetEmail: 'newuser@example.com' },
      mockReq,
    );

    expect(result).toEqual({ status: 'invited' });
    expect(result).not.toHaveProperty('shared');
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

  // --- listGroupMembers ---

  describe('GET /budget/groups/:groupId/members', () => {
    it('appelle getMembers UC et mappe les membres en DTO ISO', async () => {
      const members = [
        buildBudgetMember({ userId: 'owner-id', isOwner: true }),
        buildBudgetMember({ userId: 'invited-id', email: 'b@x.fr' }),
      ];
      useCases.getMembers.execute.mockResolvedValueOnce(members);
      const result = await controller.listGroupMembers('group-uuid', mockReq);
      expect(useCases.getMembers.execute).toHaveBeenCalledWith({
        groupId: 'group-uuid',
        userId: 'user-1',
      });
      expect(result).toHaveLength(2);
      expect(result[0].isOwner).toBe(true);
      expect(typeof result[0].joinedAt).toBe('string');
    });
  });

  // --- removeGroupMember ---

  describe('DELETE /budget/groups/:groupId/members/:userId', () => {
    it('appelle removeMember UC avec actorUserId du JWT', async () => {
      useCases.removeMember.execute.mockResolvedValueOnce(undefined);
      await controller.removeGroupMember('group-uuid', 'target-uuid', mockReq);
      expect(useCases.removeMember.execute).toHaveBeenCalledWith({
        groupId: 'group-uuid',
        actorUserId: 'user-1',
        targetUserId: 'target-uuid',
      });
    });
  });

  // --- listEntriesMonths ---

  describe('GET /budget/entries/months', () => {
    it('appelle getEntriesMonths UC avec userId du JWT', async () => {
      useCases.getEntriesMonths.execute.mockResolvedValueOnce([
        { month: 5, year: 2026 },
        { month: 4, year: 2026 },
      ]);
      const result = await controller.listEntriesMonths('group-uuid', mockReq);
      expect(useCases.getEntriesMonths.execute).toHaveBeenCalledWith({
        groupId: 'group-uuid',
        userId: 'user-1',
      });
      expect(result).toHaveLength(2);
    });
  });

  // --- listGroupPendingInvitations ---

  describe('GET /budget/groups/:groupId/invitations/pending', () => {
    it('appelle listPendingInvitations UC et mappe les invitations en DTO ISO', async () => {
      const view = [
        {
          id: 'inv-1',
          targetEmail: 'bob@example.com',
          expiresAt: new Date('2026-05-17T00:00:00.000Z'),
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
        },
        {
          id: 'inv-2',
          targetEmail: 'carol@example.com',
          expiresAt: new Date('2026-05-18T12:30:00.000Z'),
          createdAt: new Date('2026-05-11T12:30:00.000Z'),
        },
      ];
      useCases.listPendingInvitations.execute.mockResolvedValueOnce(view);

      const result = await controller.listGroupPendingInvitations(
        'group-uuid',
        mockReq,
      );

      expect(useCases.listPendingInvitations.execute).toHaveBeenCalledWith({
        groupId: 'group-uuid',
        userId: 'user-1',
      });
      expect(result.invitations).toHaveLength(2);
      expect(result.invitations[0]).toEqual({
        id: 'inv-1',
        targetEmail: 'bob@example.com',
        expiresAt: '2026-05-17T00:00:00.000Z',
        createdAt: '2026-05-10T00:00:00.000Z',
      });
      expect(typeof result.invitations[1].expiresAt).toBe('string');
      expect(typeof result.invitations[1].createdAt).toBe('string');
    });

    it('renvoie une liste vide si aucune invitation pending', async () => {
      useCases.listPendingInvitations.execute.mockResolvedValueOnce([]);

      const result = await controller.listGroupPendingInvitations(
        'group-uuid',
        mockReq,
      );

      expect(result).toEqual({ invitations: [] });
    });

    it('propage ResourceNotFoundError si le groupe est introuvable', async () => {
      useCases.listPendingInvitations.execute.mockRejectedValueOnce(
        new ResourceNotFoundError('Le groupe budget est introuvable.'),
      );

      await expect(
        controller.listGroupPendingInvitations('group-uuid', mockReq),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    });

    it('propage InsufficientPermissionsError si le demandeur n est pas owner', async () => {
      useCases.listPendingInvitations.execute.mockRejectedValueOnce(
        new InsufficientPermissionsError(
          'Seul le owner du groupe peut lister les invitations pending.',
        ),
      );

      await expect(
        controller.listGroupPendingInvitations('group-uuid', mockReq),
      ).rejects.toBeInstanceOf(InsufficientPermissionsError);
    });
  });
});
