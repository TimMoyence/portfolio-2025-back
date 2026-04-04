export interface UpdateBudgetEntryCommand {
  userId: string;
  entryId: string;
  categoryId?: string | null;
}
