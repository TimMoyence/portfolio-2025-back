/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateBudgetEntryUseCase } from './UpdateBudgetEntry.useCase';
import {
  buildBudgetEntry,
  createMockBudgetEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('UpdateBudgetEntryUseCase', () => {
  let useCase: UpdateBudgetEntryUseCase;
  let entryRepo: ReturnType<typeof createMockBudgetEntryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    entryRepo = createMockBudgetEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new UpdateBudgetEntryUseCase(entryRepo, groupRepo);
  });

  it("devrait rejeter si l'entree n'existe pas", async () => {
    entryRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        entryId: 'entry-1',
        categoryId: 'new-cat',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre du groupe", async () => {
    entryRepo.findById.mockResolvedValue(buildBudgetEntry());
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        entryId: 'entry-1',
        categoryId: 'new-cat',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("devrait mettre a jour la categoryId de l'entree", async () => {
    const entry = buildBudgetEntry();
    const updatedEntry = buildBudgetEntry({ categoryId: 'new-cat' });
    entryRepo.findById.mockResolvedValue(entry);
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.update.mockResolvedValue(updatedEntry);

    const result = await useCase.execute({
      userId: 'user-1',
      entryId: 'entry-1',
      categoryId: 'new-cat',
    });

    expect(entryRepo.update).toHaveBeenCalledWith('entry-1', {
      categoryId: 'new-cat',
    });
    expect(result).toEqual(updatedEntry);
  });

  it('devrait mettre categoryId a null si non fourni', async () => {
    const entry = buildBudgetEntry();
    const updatedEntry = buildBudgetEntry({ categoryId: null });
    entryRepo.findById.mockResolvedValue(entry);
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.update.mockResolvedValue(updatedEntry);

    await useCase.execute({ userId: 'user-1', entryId: 'entry-1' });

    expect(entryRepo.update).toHaveBeenCalledWith('entry-1', {
      categoryId: null,
    });
  });
});
