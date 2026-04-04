/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import { DeleteEntryUseCase } from './DeleteEntry.useCase';
import {
  buildSebastianEntry,
  createMockSebastianEntryRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('DeleteEntryUseCase', () => {
  let useCase: DeleteEntryUseCase;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;

  beforeEach(() => {
    entryRepo = createMockSebastianEntryRepo();
    useCase = new DeleteEntryUseCase(entryRepo);
  });

  it("devrait rejeter si l'entree n'existe pas", async () => {
    entryRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', entryId: 'entry-1' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("devrait rejeter si l'utilisateur n'est pas proprietaire", async () => {
    entryRepo.findById.mockResolvedValue(
      buildSebastianEntry({ userId: 'other-user' }),
    );

    await expect(
      useCase.execute({ userId: 'user-1', entryId: 'entry-1' }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("devrait supprimer l'entree avec succes", async () => {
    const entry = buildSebastianEntry({ userId: 'user-1' });
    entryRepo.findById.mockResolvedValue(entry);
    entryRepo.delete.mockResolvedValue(undefined);

    await useCase.execute({ userId: 'user-1', entryId: 'entry-1' });

    expect(entryRepo.findById).toHaveBeenCalledWith('entry-1');
    expect(entryRepo.delete).toHaveBeenCalledWith('entry-1');
  });
});
