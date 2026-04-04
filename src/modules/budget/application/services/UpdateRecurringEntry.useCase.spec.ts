/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import { UpdateRecurringEntryUseCase } from './UpdateRecurringEntry.useCase';
import {
  buildRecurringEntry,
  createMockRecurringEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('UpdateRecurringEntryUseCase', () => {
  let useCase: UpdateRecurringEntryUseCase;
  let recurringRepo: ReturnType<typeof createMockRecurringEntryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    recurringRepo = createMockRecurringEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new UpdateRecurringEntryUseCase(recurringRepo, groupRepo);
  });

  it("devrait rejeter si l'entree n'existe pas", async () => {
    recurringRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        entryId: 'recurring-1',
        description: 'Loyer modifie',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre du groupe", async () => {
    recurringRepo.findById.mockResolvedValue(buildRecurringEntry());
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        entryId: 'recurring-1',
        description: 'Loyer modifie',
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("devrait mettre a jour l'entree recurrente avec succes", async () => {
    const entry = buildRecurringEntry();
    const updatedEntry = buildRecurringEntry({
      description: 'Loyer modifie',
      amount: -1300,
    });
    recurringRepo.findById.mockResolvedValue(entry);
    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.update.mockResolvedValue(updatedEntry);

    const result = await useCase.execute({
      userId: 'user-1',
      entryId: 'recurring-1',
      description: 'Loyer modifie',
      amount: -1300,
    });

    expect(recurringRepo.findById).toHaveBeenCalledWith('recurring-1');
    expect(groupRepo.isMember).toHaveBeenCalledWith('group-1', 'user-1');
    expect(recurringRepo.update).toHaveBeenCalledWith('recurring-1', {
      description: 'Loyer modifie',
      amount: -1300,
    });
    expect(result).toEqual(updatedEntry);
  });
});
