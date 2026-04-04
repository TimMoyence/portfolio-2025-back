import { Inject, Injectable } from '@nestjs/common';
import type { SebastianGoal } from '../../domain/SebastianGoal';
import type { ISebastianGoalRepository } from '../../domain/ISebastianGoal.repository';
import { SEBASTIAN_GOAL_REPOSITORY } from '../../domain/token';

/** Recupere les objectifs actifs pour un utilisateur. */
@Injectable()
export class ListGoalsUseCase {
  constructor(
    @Inject(SEBASTIAN_GOAL_REPOSITORY)
    private readonly goalRepo: ISebastianGoalRepository,
  ) {}

  /** Execute la recuperation des objectifs actifs. */
  async execute(userId: string): Promise<SebastianGoal[]> {
    const goals = await this.goalRepo.findByUserId(userId);
    return goals.filter((g) => g.isActive);
  }
}
