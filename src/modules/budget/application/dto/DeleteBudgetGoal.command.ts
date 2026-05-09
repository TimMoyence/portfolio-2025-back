/** Command DTO pour supprimer un BudgetGoal. */
export interface DeleteBudgetGoalCommand {
  goalId: string;
  /** UserId du demandeur (utilise pour le member check sur le goal.groupId). */
  userId: string;
}
