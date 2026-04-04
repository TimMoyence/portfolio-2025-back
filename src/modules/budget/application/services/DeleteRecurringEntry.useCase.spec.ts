/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import { DeleteRecurringEntryUseCase } from './DeleteRecurringEntry.useCase';
import {
  buildRecurringEntry,
  createMockRecurringEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('DeleteRecurringEntryUseCase', () => {
  let useCase: DeleteRecurringEntryUseCase;
  let recurringRepo: ReturnType<typeof createMockRecurringEntryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    recurringRepo = createMockRecurringEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new DeleteRecurringEntryUseCase(recurringRepo, groupRepo);
  });

  it("devrait rejeter si l'entree n'existe pas", async () => {
    recurringRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', entryId: 'recurring-1' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre du groupe", async () => {
    recurringRepo.findById.mockResolvedValue(buildRecurringEntry());
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: 'user-1', entryId: 'recurring-1' }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("devrait supprimer l'entree recurrente avec succes", async () => {
    const entry = buildRecurringEntry();
    recurringRepo.findById.mockResolvedValue(entry);
    groupRepo.isMember.mockResolvedValue(true);
    recurringRepo.delete.mockResolvedValue(undefined);

    await useCase.execute({ userId: 'user-1', entryId: 'recurring-1' });

    expect(recurringRepo.findById).toHaveBeenCalledWith('recurring-1');
    expect(groupRepo.isMember).toHaveBeenCalledWith('group-1', 'user-1');
    expect(recurringRepo.delete).toHaveBeenCalledWith('recurring-1');
  });
});
