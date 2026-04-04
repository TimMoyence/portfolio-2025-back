/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException } from '@nestjs/common';
import { GetBudgetEntriesUseCase } from './GetBudgetEntries.useCase';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  buildBudgetEntry,
  createMockBudgetEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('GetBudgetEntriesUseCase', () => {
  let useCase: GetBudgetEntriesUseCase;
  let entryRepo: jest.Mocked<IBudgetEntryRepository>;
  let groupRepo: jest.Mocked<IBudgetGroupRepository>;

  beforeEach(() => {
    entryRepo = createMockBudgetEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new GetBudgetEntriesUseCase(entryRepo, groupRepo);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: 'user-1', groupId: 'group-1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('devrait retourner les entrees filtrees', async () => {
    const entry = buildBudgetEntry();
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue([entry]);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
    });

    expect(result).toEqual([entry]);
    expect(entryRepo.findByFilters).toHaveBeenCalledTimes(1);
  });

  it('devrait passer les filtres month/year/categoryId au repository', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.findByFilters.mockResolvedValue([]);

    await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      month: 3,
      year: 2026,
      categoryId: 'cat-1',
    });

    expect(entryRepo.findByFilters).toHaveBeenCalledWith({
      groupId: 'group-1',
      month: 3,
      year: 2026,
      categoryId: 'cat-1',
    });
  });
});
