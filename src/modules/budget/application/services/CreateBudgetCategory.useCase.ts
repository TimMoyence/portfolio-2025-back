import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { BudgetCategory } from '../../domain/BudgetCategory';
import type { IBudgetCategoryRepository } from '../../domain/IBudgetCategory.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { CreateBudgetCategoryCommand } from '../dto/CreateBudgetCategory.command';

/** Cree une categorie de budget custom pour un groupe. */
@Injectable()
export class CreateBudgetCategoryUseCase {
  constructor(
    @Inject(BUDGET_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBudgetCategoryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: CreateBudgetCategoryCommand): Promise<BudgetCategory> {
    const isMember = await this.groupRepo.isMember(
      command.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    const category = BudgetCategory.create({
      groupId: command.groupId,
      name: command.name,
      color: command.color,
      icon: command.icon,
      budgetType: command.budgetType,
      budgetLimit: command.budgetLimit,
    });
    return this.categoryRepo.create(category);
  }
}
