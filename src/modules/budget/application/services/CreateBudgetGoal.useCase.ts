import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { BudgetGoal } from '../../domain/BudgetGoal';
import type { IBudgetGoalRepository } from '../../domain/IBudgetGoal.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_GOAL_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { CreateBudgetGoalCommand } from '../dto/CreateBudgetGoal.command';

/**
 * Cree un nouvel objectif de budget pour un groupe. Verifie l'appartenance
 * du demandeur au groupe, puis delegue les invariants metier au domain
 * (ex : CATEGORY_LIMIT exige categoryId via InvalidInputError).
 */
@Injectable()
export class CreateBudgetGoalUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_GOAL_REPOSITORY)
    private readonly goalRepo: IBudgetGoalRepository,
  ) {}

  async execute(command: CreateBudgetGoalCommand): Promise<BudgetGoal> {
    const isMember = await this.groupRepo.isMember(
      command.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    const goal = BudgetGoal.create({
      groupId: command.groupId,
      createdByUserId: command.userId,
      name: command.name,
      kind: command.kind,
      targetAmount: command.targetAmount,
      categoryId: command.categoryId,
      deadline: command.deadline,
    });
    return this.goalRepo.create(goal);
  }
}
