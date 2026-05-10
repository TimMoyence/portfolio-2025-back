import type { BudgetGoalKind } from '../../domain/BudgetGoal';

/** Command DTO pour creer un BudgetGoal. */
export interface CreateBudgetGoalCommand {
  groupId: string;
  /** UserId du demandeur (devient createdByUserId du goal). */
  userId: string;
  name: string;
  kind: BudgetGoalKind;
  targetAmount: number;
  categoryId: string | null;
  deadline: Date | null;
}
