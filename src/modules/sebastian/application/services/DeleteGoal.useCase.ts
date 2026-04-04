import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { ISebastianGoalRepository } from '../../domain/ISebastianGoal.repository';
import { SEBASTIAN_GOAL_REPOSITORY } from '../../domain/token';
import type { DeleteGoalCommand } from '../dto/DeleteGoal.command';

/** Supprime un objectif de consommation apres verification des droits. */
@Injectable()
export class DeleteGoalUseCase {
  constructor(
    @Inject(SEBASTIAN_GOAL_REPOSITORY)
    private readonly goalRepo: ISebastianGoalRepository,
  ) {}

  /** Execute la suppression d'un objectif de consommation. */
  async execute(command: DeleteGoalCommand): Promise<void> {
    const goal = await this.goalRepo.findById(command.goalId);
    if (!goal) {
      throw new ResourceNotFoundError('Objectif de consommation introuvable');
    }

    if (goal.userId !== command.userId) {
      throw new InsufficientPermissionsError(
        "L'utilisateur n'est pas proprietaire de cet objectif",
      );
    }

    await this.goalRepo.delete(command.goalId);
  }
}
