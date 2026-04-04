import type { BudgetType } from '../../domain/BudgetCategory';
import type { Frequency } from '../../domain/RecurringEntry';

export interface UpdateRecurringEntryCommand {
  userId: string;
  entryId: string;
  categoryId?: string | null;
  description?: string;
  amount?: number;
  type?: BudgetType;
  frequency?: Frequency;
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  startDate?: Date;
  endDate?: Date | null;
  isActive?: boolean;
}
