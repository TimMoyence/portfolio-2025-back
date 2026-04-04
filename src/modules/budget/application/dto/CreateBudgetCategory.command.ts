export interface CreateBudgetCategoryCommand {
  userId: string;
  groupId: string;
  name: string;
  color?: string;
  icon?: string;
  budgetType: string;
  budgetLimit?: number;
}
