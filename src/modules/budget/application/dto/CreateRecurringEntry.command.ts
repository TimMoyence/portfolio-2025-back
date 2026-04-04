export interface CreateRecurringEntryCommand {
  userId: string;
  groupId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  type: string;
  frequency: string;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: Date;
  endDate: Date | null;
}
