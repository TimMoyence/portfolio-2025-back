import type { BudgetGoalUpdatePatch } from '../../domain/IBudgetGoal.repository';

/** Command DTO pour mettre a jour un BudgetGoal. */
export interface UpdateBudgetGoalCommand {
  goalId: string;
  /** UserId du demandeur (utilise pour le member check sur le goal.groupId). */
  userId: string;
  patch: BudgetGoalUpdatePatch;
}
