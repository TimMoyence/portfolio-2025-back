/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import { DeleteBudgetEntryUseCase } from './DeleteBudgetEntry.useCase';
import {
  buildBudgetEntry,
  createMockBudgetEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('DeleteBudgetEntryUseCase', () => {
  let useCase: DeleteBudgetEntryUseCase;
  let entryRepo: ReturnType<typeof createMockBudgetEntryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    entryRepo = createMockBudgetEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new DeleteBudgetEntryUseCase(entryRepo, groupRepo);
  });

  it("devrait rejeter si l'entree n'existe pas", async () => {
    entryRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', entryId: 'entry-1' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre du groupe", async () => {
    entryRepo.findById.mockResolvedValue(buildBudgetEntry());
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: 'user-1', entryId: 'entry-1' }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("devrait supprimer l'entree avec succes", async () => {
    const entry = buildBudgetEntry();
    entryRepo.findById.mockResolvedValue(entry);
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.delete.mockResolvedValue(undefined);

    await useCase.execute({ userId: 'user-1', entryId: 'entry-1' });

    expect(entryRepo.findById).toHaveBeenCalledWith('entry-1');
    expect(groupRepo.isMember).toHaveBeenCalledWith('group-1', 'user-1');
    expect(entryRepo.delete).toHaveBeenCalledWith('entry-1');
  });
});
