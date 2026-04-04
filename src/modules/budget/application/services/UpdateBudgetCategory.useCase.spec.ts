/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import { UpdateBudgetCategoryUseCase } from './UpdateBudgetCategory.useCase';
import {
  buildBudgetCategory,
  createMockBudgetCategoryRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('UpdateBudgetCategoryUseCase', () => {
  let useCase: UpdateBudgetCategoryUseCase;
  let categoryRepo: ReturnType<typeof createMockBudgetCategoryRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(() => {
    categoryRepo = createMockBudgetCategoryRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new UpdateBudgetCategoryUseCase(categoryRepo, groupRepo);
  });

  it("devrait rejeter si la categorie n'existe pas", async () => {
    categoryRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        categoryId: 'cat-unknown',
        name: 'Nouveau nom',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("devrait rejeter la modification d'une categorie par defaut (groupId null)", async () => {
    const globalCategory = buildBudgetCategory({ groupId: null });
    categoryRepo.findById.mockResolvedValue(globalCategory);

    await expect(
      useCase.execute({
        userId: 'user-1',
        categoryId: 'cat-1',
        name: 'Modifie',
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("devrait rejeter si l'utilisateur n'est pas membre du groupe", async () => {
    const customCategory = buildBudgetCategory({ groupId: 'group-1' });
    categoryRepo.findById.mockResolvedValue(customCategory);
    groupRepo.isMember.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        categoryId: 'cat-1',
        budgetLimit: 500,
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it('devrait mettre a jour une categorie custom avec succes', async () => {
    const customCategory = buildBudgetCategory({ groupId: 'group-1' });
    const updatedCategory = buildBudgetCategory({
      groupId: 'group-1',
      name: 'Alimentation',
      budgetLimit: 800,
    });
    categoryRepo.findById.mockResolvedValue(customCategory);
    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.update.mockResolvedValue(updatedCategory);

    const result = await useCase.execute({
      userId: 'user-1',
      categoryId: 'cat-1',
      name: 'Alimentation',
      budgetLimit: 800,
    });

    expect(categoryRepo.update).toHaveBeenCalledWith('cat-1', {
      name: 'Alimentation',
      budgetLimit: 800,
    });
    expect(result).toEqual(updatedCategory);
  });

  it('devrait ne passer que les champs definis au repository', async () => {
    const customCategory = buildBudgetCategory({ groupId: 'group-1' });
    const updatedCategory = buildBudgetCategory({
      groupId: 'group-1',
      color: '#FF0000',
    });
    categoryRepo.findById.mockResolvedValue(customCategory);
    groupRepo.isMember.mockResolvedValue(true);
    categoryRepo.update.mockResolvedValue(updatedCategory);

    await useCase.execute({
      userId: 'user-1',
      categoryId: 'cat-1',
      color: '#FF0000',
    });

    expect(categoryRepo.update).toHaveBeenCalledWith('cat-1', {
      color: '#FF0000',
    });
  });
});
