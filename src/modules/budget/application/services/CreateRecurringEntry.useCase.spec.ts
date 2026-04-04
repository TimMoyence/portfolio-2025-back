/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { InsufficientPermissionsError } from '../../../../common/domain/errors';
import { CreateRecurringEntryUseCase } from './CreateRecurringEntry.useCase';
import {
  buildRecurringEntry,
  createMockRecurringEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('CreateRecurringEntryUseCase', () => {
  let useCase: CreateRecurringEntryUseCase;
  let recurringRepo: ReturnType<typeof createMockRecurringEntryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    recurringRepo = createMockRecurringEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new CreateRecurringEntryUseCase(recurringRepo, groupRepo);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        groupId: 'group-1',
        categoryId: 'cat-1',
        description: 'Loyer',
        amount: -1200,
        type: 'FIXED',
        frequency: 'MONTHLY',
        dayOfMonth: 1,
        dayOfWeek: null,
        startDate: new Date('2026-01-01'),
        endDate: null,
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it('devrait creer une entree recurrente via le domaine et le repository', async () => {
    const entry = buildRecurringEntry();
    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.create.mockResolvedValue(entry);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      categoryId: 'cat-1',
      description: 'Loyer',
      amount: -1200,
      type: 'FIXED',
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      dayOfWeek: null,
      startDate: new Date('2026-01-01'),
      endDate: null,
    });

    expect(recurringRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(entry);
  });

  it('devrait propager les erreurs de validation du domaine', async () => {
    groupRepo.isMember.mockResolvedValue(true);

    await expect(
      useCase.execute({
        userId: 'user-1',
        groupId: 'group-1',
        categoryId: null,
        description: 'Loyer',
        amount: 0,
        type: 'FIXED',
        frequency: 'MONTHLY',
        dayOfMonth: 1,
        dayOfWeek: null,
        startDate: new Date('2026-01-01'),
        endDate: null,
      }),
    ).rejects.toThrow(DomainValidationError);
  });
});
