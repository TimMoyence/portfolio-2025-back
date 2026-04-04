/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors';
import { GetBudgetCategoriesUseCase } from './GetBudgetCategories.useCase';
import type { IBudgetCategoryRepository } from '../../domain/IBudgetCategory.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  buildBudgetCategory,
  createMockBudgetCategoryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('GetBudgetCategoriesUseCase', () => {
  let useCase: GetBudgetCategoriesUseCase;
  let categoryRepo: jest.Mocked<IBudgetCategoryRepository>;
  let groupRepo: jest.Mocked<IBudgetGroupRepository>;

  beforeEach(() => {
    categoryRepo = createMockBudgetCategoryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new GetBudgetCategoriesUseCase(categoryRepo, groupRepo);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre", async () => {
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: 'user-1', groupId: 'group-1' }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it('devrait retourner les categories du groupe', async () => {
    const category = buildBudgetCategory();
    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([category]);

    const result = await useCase.execute({
      userId: 'user-1',
      groupId: 'group-1',
    });

    expect(result).toEqual([category]);
    expect(categoryRepo.findByGroupId).toHaveBeenCalledTimes(1);
  });

  it('devrait appeler findByGroupId avec le bon groupId', async () => {
    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.findByGroupId.mockResolvedValue([]);

    await useCase.execute({ userId: 'user-1', groupId: 'group-1' });

    expect(categoryRepo.findByGroupId).toHaveBeenCalledWith('group-1');
  });
});
