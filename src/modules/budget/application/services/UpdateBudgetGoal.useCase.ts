import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { InvalidInputError } from '../../../../common/domain/errors/InvalidInputError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { BudgetGoal } from '../../domain/BudgetGoal';
import type { IBudgetGoalRepository } from '../../domain/IBudgetGoal.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_GOAL_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { UpdateBudgetGoalCommand } from '../dto/UpdateBudgetGoal.command';

/**
 * Met a jour un BudgetGoal existant. Verifie successivement : existence du
 * goal, appartenance du demandeur au groupe du goal, coherence du patch
 * (CATEGORY_LIMIT exige toujours un categoryId).
 */
@Injectable()
export class UpdateBudgetGoalUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_GOAL_REPOSITORY)
    private readonly goalRepo: IBudgetGoalRepository,
  ) {}

  async execute(command: UpdateBudgetGoalCommand): Promise<BudgetGoal> {
    const existing = await this.goalRepo.findById(command.goalId);
    if (!existing) {
      throw new ResourceNotFoundError(`Goal ${command.goalId} not found`);
    }
    const isMember = await this.groupRepo.isMember(
      existing.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    const nextKind = command.patch.kind ?? existing.kind;
    const nextCategoryId =
      command.patch.categoryId !== undefined
        ? command.patch.categoryId
        : existing.categoryId;
    if (nextKind === 'CATEGORY_LIMIT' && nextCategoryId == null) {
      throw new InvalidInputError(
        'categoryId is required for CATEGORY_LIMIT goals',
      );
    }
    return this.goalRepo.update(command.goalId, command.patch);
  }
}
