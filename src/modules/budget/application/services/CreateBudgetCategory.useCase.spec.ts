/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { CreateBudgetCategoryUseCase } from './CreateBudgetCategory.useCase';
import {
  buildBudgetCategory,
  createMockBudgetCategoryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('CreateBudgetCategoryUseCase', () => {
  let useCase: CreateBudgetCategoryUseCase;
  let categoryRepo: ReturnType<typeof createMockBudgetCategoryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    categoryRepo = createMockBudgetCategoryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new CreateBudgetCategoryUseCase(categoryRepo, groupRepo);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        groupId: 'group-1',
        name: 'Custom',
        budgetType: 'VARIABLE',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('devrait creer une categorie via le domaine et le repository', async () => {
    const category = buildBudgetCategory({
      name: 'Custom',
      budgetType: 'VARIABLE',
    });
    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.create.mockResolvedValue(category);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
      name: 'Custom',
      budgetType: 'VARIABLE',
    });

    expect(categoryRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(category);
  });

  it('devrait propager les erreurs de validation du domaine', async () => {
    groupRepo.isMember.mockResolvedValue(true);

    await expect(
      useCase.execute({
        userId: 'user-1',
        groupId: 'group-1',
        name: '',
        budgetType: 'VARIABLE',
      }),
    ).rejects.toThrow(DomainValidationError);
  });
});
