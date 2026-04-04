import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { BudgetCategory } from '../../domain/BudgetCategory';
import type { IBudgetCategoryRepository } from '../../domain/IBudgetCategory.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { UpdateBudgetCategoryCommand } from '../dto/UpdateBudgetCategory.command';

/** Met a jour une categorie de budget (nom, couleur, icone, budgetLimit, etc.). */
@Injectable()
export class UpdateBudgetCategoryUseCase {
  constructor(
    @Inject(BUDGET_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBudgetCategoryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  /** Execute la mise a jour partielle d'une categorie. */
  async execute(command: UpdateBudgetCategoryCommand): Promise<BudgetCategory> {
    const category = await this.categoryRepo.findById(command.categoryId);
    if (!category) {
      throw new ResourceNotFoundError('Budget category not found');
    }

    if (!category.groupId) {
      throw new InsufficientPermissionsError(
        'Impossible de modifier une categorie par defaut',
      );
    }

    const isMember = await this.groupRepo.isMember(
      category.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }

    const updateData: Partial<BudgetCategory> = {};
    if (command.name !== undefined) updateData.name = command.name;
    if (command.color !== undefined) updateData.color = command.color;
    if (command.icon !== undefined) updateData.icon = command.icon;
    if (command.budgetType !== undefined)
      updateData.budgetType = command.budgetType;
    if (command.budgetLimit !== undefined)
      updateData.budgetLimit = command.budgetLimit;

    return this.categoryRepo.update(command.categoryId, updateData);
  }
}
