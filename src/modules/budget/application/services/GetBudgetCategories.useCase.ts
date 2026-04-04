import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import type { BudgetCategory } from '../../domain/BudgetCategory';
import type { IBudgetCategoryRepository } from '../../domain/IBudgetCategory.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';

/** Recupere les categories (defaut + custom du groupe). */
@Injectable()
export class GetBudgetCategoriesUseCase {
  constructor(
    @Inject(BUDGET_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBudgetCategoryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(params: {
    userId: string;
    groupId: string;
  }): Promise<BudgetCategory[]> {
    const isMember = await this.groupRepo.isMember(
      params.groupId,
      params.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    return this.categoryRepo.findByGroupId(params.groupId);
  }
}
