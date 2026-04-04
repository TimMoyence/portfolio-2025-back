export interface GetBudgetEntriesQuery {
  userId: string;
  groupId: string;
  month?: number;
  year?: number;
  categoryId?: string;
}
