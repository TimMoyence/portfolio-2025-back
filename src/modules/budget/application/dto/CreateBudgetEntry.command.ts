export interface CreateBudgetEntryCommand {
  userId: string;
  groupId: string;
  categoryId?: string | null;
  date: string;
  description: string;
  amount: number;
  type: string;
  state?: string;
}
