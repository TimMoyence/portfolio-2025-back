import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { IBudgetGoalRepository } from '../../domain/IBudgetGoal.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_GOAL_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';

export interface DeleteBudgetGoalCommand {
  goalId: string;
  userId: string;
}

/**
 * Supprime un BudgetGoal. Verifie l'existence puis l'appartenance du
 * demandeur au groupe du goal avant la suppression.
 */
@Injectable()
export class DeleteBudgetGoalUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_GOAL_REPOSITORY)
    private readonly goalRepo: IBudgetGoalRepository,
  ) {}

  async execute(command: DeleteBudgetGoalCommand): Promise<void> {
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
    await this.goalRepo.delete(command.goalId);
  }
}
