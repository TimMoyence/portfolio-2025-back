/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors';
import { ApplyRecurringEntriesUseCase } from './ApplyRecurringEntries.useCase';
import {
  buildRecurringEntry,
  buildBudgetEntry,
  createMockRecurringEntryRepo,
  createMockBudgetEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('ApplyRecurringEntriesUseCase', () => {
  let useCase: ApplyRecurringEntriesUseCase;
  let recurringRepo: ReturnType<typeof createMockRecurringEntryRepo>;
  let entryRepo: ReturnType<typeof createMockBudgetEntryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    recurringRepo = createMockRecurringEntryRepo();
    entryRepo = createMockBudgetEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    // Par defaut, aucune entry existante (pas de doublon)
    entryRepo.findByFilters.mockResolvedValue([]);
    useCase = new ApplyRecurringEntriesUseCase(
      recurringRepo,
      entryRepo,
      groupRepo,
    );
  });

  it("devrait rejeter si l'utilisateur n'est pas membre", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        groupId: 'group-1',
        month: 3,
        year: 2026,
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it('devrait generer 1 entree pour une recurring MONTHLY', async () => {
    const recurring = buildRecurringEntry({
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      dayOfWeek: null,
      startDate: new Date('2026-01-01'),
      endDate: null,
    });
    const createdEntry = buildBudgetEntry();

    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findActiveByGroupId.mockResolvedValue([recurring]);
    entryRepo.createMany.mockResolvedValue([createdEntry]);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });

    expect(entryRepo.createMany).toHaveBeenCalledTimes(1);
    const createdEntries = entryRepo.createMany.mock.calls[0][0];
    expect(createdEntries).toHaveLength(1);
    expect(result).toEqual([createdEntry]);
  });

  it('devrait generer 4-5 entrees pour une recurring WEEKLY', async () => {
    // Mars 2026 : les lundis (dayOfWeek=1) sont le 2, 9, 16, 23, 30 = 5 lundis
    const recurring = buildRecurringEntry({
      frequency: 'WEEKLY',
      dayOfMonth: null,
      dayOfWeek: 1,
      startDate: new Date('2026-01-01'),
      endDate: null,
    });

    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findActiveByGroupId.mockResolvedValue([recurring]);
    entryRepo.createMany.mockResolvedValue([]);

    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });

    expect(entryRepo.createMany).toHaveBeenCalledTimes(1);
    const createdEntries = entryRepo.createMany.mock.calls[0][0];
    expect(createdEntries.length).toBeGreaterThanOrEqual(4);
    expect(createdEntries.length).toBeLessThanOrEqual(5);
  });

  it('devrait generer 2-3 entrees pour une recurring BIWEEKLY', async () => {
    const recurring = buildRecurringEntry({
      frequency: 'BIWEEKLY',
      dayOfMonth: null,
      dayOfWeek: 3,
      startDate: new Date('2026-01-01'),
      endDate: null,
    });

    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findActiveByGroupId.mockResolvedValue([recurring]);
    entryRepo.createMany.mockResolvedValue([]);

    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });

    expect(entryRepo.createMany).toHaveBeenCalledTimes(1);
    const createdEntries = entryRepo.createMany.mock.calls[0][0];
    expect(createdEntries.length).toBeGreaterThanOrEqual(2);
    expect(createdEntries.length).toBeLessThanOrEqual(3);
  });

  it('devrait filtrer les dates hors de la plage startDate/endDate', async () => {
    const recurring = buildRecurringEntry({
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      dayOfWeek: null,
      startDate: new Date('2026-04-01'),
      endDate: null,
    });

    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findActiveByGroupId.mockResolvedValue([recurring]);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });

    // Mars 2026 est avant startDate (avril 2026) => aucune entree
    expect(entryRepo.createMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('devrait respecter la endDate', async () => {
    const recurring = buildRecurringEntry({
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      dayOfWeek: null,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-02-28'),
    });

    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findActiveByGroupId.mockResolvedValue([recurring]);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });

    // Mars 2026 est apres endDate (fevrier 2026) => aucune entree
    expect(entryRepo.createMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('devrait retourner un tableau vide si aucune recurring active', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findActiveByGroupId.mockResolvedValue([]);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });

    expect(result).toEqual([]);
    expect(entryRepo.createMany).not.toHaveBeenCalled();
  });

  it('devrait creer les entrees avec state PENDING', async () => {
    const recurring = buildRecurringEntry({
      frequency: 'MONTHLY',
      dayOfMonth: 10,
      dayOfWeek: null,
      startDate: new Date('2026-01-01'),
      endDate: null,
    });

    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findActiveByGroupId.mockResolvedValue([recurring]);
    entryRepo.createMany.mockResolvedValue([]);

    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });

    const createdEntries = entryRepo.createMany.mock.calls[0][0];
    expect(createdEntries[0].state).toBe('PENDING');
  });

  it('devrait retourner les entries PENDING existantes sans recreer (idempotence)', async () => {
    const existingPending = [
      buildBudgetEntry({
        id: 'pending-1',
        state: 'PENDING',
        groupId: 'group-1',
      }),
      buildBudgetEntry({
        id: 'pending-2',
        state: 'PENDING',
        groupId: 'group-1',
      }),
    ];

    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue(existingPending);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });

    // Ne devrait pas appeler createMany ni findActiveByGroupId
    expect(recurringRepo.findActiveByGroupId).not.toHaveBeenCalled();
    expect(entryRepo.createMany).not.toHaveBeenCalled();
    expect(result).toEqual(existingPending);
  });

  it('devrait ignorer les entries COMPLETED existantes et generer normalement', async () => {
    const existingCompleted = [
      buildBudgetEntry({
        id: 'completed-1',
        state: 'COMPLETED',
        groupId: 'group-1',
      }),
    ];
    const recurring = buildRecurringEntry({
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      dayOfWeek: null,
      startDate: new Date('2026-01-01'),
      endDate: null,
    });
    const createdEntry = buildBudgetEntry({ id: 'new-1', state: 'PENDING' });

    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue(existingCompleted);
    recurringRepo.findActiveByGroupId.mockResolvedValue([recurring]);
    entryRepo.createMany.mockResolvedValue([createdEntry]);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
    });

    // Les entries COMPLETED ne bloquent pas la creation
    expect(entryRepo.createMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual([createdEntry]);
  });

  it('devrait ajuster dayOfMonth si superieur au nombre de jours du mois', async () => {
    // Fevrier 2026 : 28 jours, dayOfMonth=31 => doit generer au 28
    const recurring = buildRecurringEntry({
      frequency: 'MONTHLY',
      dayOfMonth: 31,
      dayOfWeek: null,
      startDate: new Date('2026-01-01'),
      endDate: null,
    });

    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.findActiveByGroupId.mockResolvedValue([recurring]);
    entryRepo.createMany.mockResolvedValue([]);

    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 2,
      year: 2026,
    });

    const createdEntries = entryRepo.createMany.mock.calls[0][0];
    expect(createdEntries).toHaveLength(1);
    const entryDate = createdEntries[0].date;
    expect(entryDate.getDate()).toBe(28);
  });
});
