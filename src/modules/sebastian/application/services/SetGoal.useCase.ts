import { Inject, Injectable } from '@nestjs/common';
import { SebastianGoal } from '../../domain/SebastianGoal';
import type { ISebastianGoalRepository } from '../../domain/ISebastianGoal.repository';
import { SEBASTIAN_GOAL_REPOSITORY } from '../../domain/token';
import type { SetGoalCommand } from '../dto/SetGoal.command';

/** Cree un objectif de consommation via le domaine et le persiste. */
@Injectable()
export class SetGoalUseCase {
  constructor(
    @Inject(SEBASTIAN_GOAL_REPOSITORY)
    private readonly goalRepo: ISebastianGoalRepository,
  ) {}

  /** Execute la creation d'un objectif de consommation. */
  async execute(command: SetGoalCommand): Promise<SebastianGoal> {
    const goal = SebastianGoal.create({
      userId: command.userId,
      category: command.category,
      targetQuantity: command.targetQuantity,
      period: command.period,
    });
    return this.goalRepo.create(goal);
  }
}
