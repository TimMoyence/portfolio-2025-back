import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import type { BudgetEntry } from '../../domain/BudgetEntry';
import type {
  BudgetGoal,
  BudgetGoalWithProgress,
} from '../../domain/BudgetGoal';
import { withProgress } from '../../domain/BudgetGoal';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGoalRepository } from '../../domain/IBudgetGoal.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GOAL_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';

export interface GetBudgetGoalsWithProgressQuery {
  groupId: string;
  userId: string;
  month: number;
  year: number;
}

/**
 * Recupere les objectifs d'un groupe enrichis de leur progression
 * (currentAmount + progressPercent) calculee depuis les entries du mois.
 *
 * Calcul du currentAmount selon le kind :
 *  - SAVINGS : somme des entries VARIABLE avec amount > 0
 *  - SPENDING_LIMIT : valeur absolue de la somme des entries amount < 0
 *  - CATEGORY_LIMIT : valeur absolue de la somme des entries du categoryId
 *
 * Optimisation : une seule lecture des entries pour boucler sur tous les goals
 * (pas de N+1).
 */
@Injectable()
export class GetBudgetGoalsWithProgressUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_GOAL_REPOSITORY)
    private readonly goalRepo: IBudgetGoalRepository,
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
  ) {}

  /** Verifie l'appartenance puis retourne les goals enrichis pour la periode. */
  async execute(
    query: GetBudgetGoalsWithProgressQuery,
  ): Promise<BudgetGoalWithProgress[]> {
    const isMember = await this.groupRepo.isMember(query.groupId, query.userId);
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    const goals = await this.goalRepo.findByGroupId(query.groupId);
    if (goals.length === 0) return [];

    const entries = await this.entryRepo.findByFilters({
      groupId: query.groupId,
      month: query.month,
      year: query.year,
    });

    return goals.map((goal) =>
      withProgress(goal, this.computeCurrentAmount(goal, entries)),
    );
  }

  /** Calcule le montant courant d'un goal selon son kind a partir des entries. */
  private computeCurrentAmount(
    goal: BudgetGoal,
    entries: BudgetEntry[],
  ): number {
    switch (goal.kind) {
      case 'SAVINGS':
        return entries
          .filter((e) => e.type === 'VARIABLE' && e.amount > 0)
          .reduce((sum, e) => sum + e.amount, 0);
      case 'SPENDING_LIMIT':
        return Math.abs(
          entries
            .filter((e) => e.amount < 0)
            .reduce((sum, e) => sum + e.amount, 0),
        );
      case 'CATEGORY_LIMIT':
        return Math.abs(
          entries
            .filter((e) => e.categoryId === goal.categoryId)
            .reduce((sum, e) => sum + e.amount, 0),
        );
      default: {
        const exhaustive: never = goal.kind;
        throw new Error(`Unsupported goal kind: ${String(exhaustive)}`);
      }
    }
  }
}
