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

  it("devrait rejeter la modification d'une categorie par defaut SANS groupId fourni", async () => {
    const globalCategory = buildBudgetCategory({ groupId: null });
    categoryRepo.findById.mockResolvedValue(globalCategory);

    // Pas de groupId dans la command -> impossible de savoir dans quel
    // groupe cloner. Refus pour proteger la categorie globale.
    await expect(
      useCase.execute({
        userId: 'user-1',
        categoryId: 'cat-1',
        name: 'Modifie',
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  describe('auto-clone categorie par defaut', () => {
    it('clone la categorie par defaut dans le groupe quand aucun clone existant', async () => {
      const defaultCategory = buildBudgetCategory({
        id: 'cat-default',
        groupId: null,
        name: 'Alimentation',
        color: '#22C55E',
        icon: 'shopping-cart',
        budgetType: 'VARIABLE',
        budgetLimit: 0,
        displayOrder: 8,
      });
      const createdClone = buildBudgetCategory({
        id: 'cat-clone',
        groupId: 'group-1',
        name: 'Alimentation',
        color: '#22C55E',
        icon: 'shopping-cart',
        budgetType: 'VARIABLE',
        budgetLimit: 800,
        displayOrder: 8,
        replacesDefaultId: 'cat-default',
      });

      categoryRepo.findById.mockResolvedValue(defaultCategory);
      groupRepo.isMember.mockResolvedValue(true);
      categoryRepo.findCloneInGroup.mockResolvedValue(null);
      categoryRepo.create.mockResolvedValue(createdClone);

      const result = await useCase.execute({
        userId: 'user-1',
        categoryId: 'cat-default',
        groupId: 'group-1',
        budgetLimit: 800,
      });

      expect(categoryRepo.findCloneInGroup).toHaveBeenCalledWith(
        'group-1',
        'cat-default',
      );
      expect(categoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'group-1',
          replacesDefaultId: 'cat-default',
          name: 'Alimentation',
          color: '#22C55E',
          icon: 'shopping-cart',
          budgetType: 'VARIABLE',
          budgetLimit: 800,
          displayOrder: 8,
        }),
      );
      expect(categoryRepo.update).not.toHaveBeenCalled();
      expect(result).toEqual(createdClone);
    });

    it('met a jour le clone existant au lieu d en creer un second', async () => {
      const defaultCategory = buildBudgetCategory({
        id: 'cat-default',
        groupId: null,
      });
      const existingClone = buildBudgetCategory({
        id: 'cat-clone',
        groupId: 'group-1',
        replacesDefaultId: 'cat-default',
        budgetLimit: 500,
      });
      const updatedClone = buildBudgetCategory({
        id: 'cat-clone',
        groupId: 'group-1',
        replacesDefaultId: 'cat-default',
        budgetLimit: 900,
      });

      categoryRepo.findById.mockResolvedValue(defaultCategory);
      groupRepo.isMember.mockResolvedValue(true);
      categoryRepo.findCloneInGroup.mockResolvedValue(existingClone);
      categoryRepo.update.mockResolvedValue(updatedClone);

      const result = await useCase.execute({
        userId: 'user-1',
        categoryId: 'cat-default',
        groupId: 'group-1',
        budgetLimit: 900,
      });

      expect(categoryRepo.update).toHaveBeenCalledWith('cat-clone', {
        budgetLimit: 900,
      });
      expect(categoryRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual(updatedClone);
    });

    it("refuse le clone si l'utilisateur n'est pas membre du groupe cible", async () => {
      const defaultCategory = buildBudgetCategory({
        id: 'cat-default',
        groupId: null,
      });
      categoryRepo.findById.mockResolvedValue(defaultCategory);
      groupRepo.isMember.mockResolvedValue(false);

      await expect(
        useCase.execute({
          userId: 'intruder',
          categoryId: 'cat-default',
          groupId: 'group-1',
          budgetLimit: 800,
        }),
      ).rejects.toThrow(InsufficientPermissionsError);

      expect(categoryRepo.create).not.toHaveBeenCalled();
      expect(categoryRepo.update).not.toHaveBeenCalled();
    });
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
