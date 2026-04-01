/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { CreateBudgetEntryUseCase } from './CreateBudgetEntry.useCase';
import {
  buildBudgetEntry,
  createMockBudgetEntryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('CreateBudgetEntryUseCase', () => {
  let useCase: CreateBudgetEntryUseCase;
  let entryRepo: ReturnType<typeof createMockBudgetEntryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    entryRepo = createMockBudgetEntryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new CreateBudgetEntryUseCase(entryRepo, groupRepo);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        groupId: 'group-1',
        date: '2026-03-15',
        description: 'Test',
        amount: -50,
        type: 'VARIABLE',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('devrait creer une entree via le domaine et le repository', async () => {
    const entry = buildBudgetEntry();
    groupRepo.isMember.mockResolvedValue(true);
    entryRepo.create.mockResolvedValue(entry);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      date: '2026-03-15',
      description: 'Test',
      amount: -50,
      type: 'VARIABLE',
    });

    expect(entryRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(entry);
  });

  it('devrait propager les erreurs de validation du domaine', async () => {
    groupRepo.isMember.mockResolvedValue(true);

    await expect(
      useCase.execute({
        userId: 'user-1',
        groupId: 'group-1',
        date: '2026-03-15',
        description: 'Test',
        amount: 0,
        type: 'VARIABLE',
      }),
    ).rejects.toThrow(DomainValidationError);
  });
});
