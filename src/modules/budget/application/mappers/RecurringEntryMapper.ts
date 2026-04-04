import { RecurringEntry } from '../../domain/RecurringEntry';

/** Representation externe d'une entree recurrente de budget. */
export interface RecurringEntryResponse {
  id: string;
  groupId: string;
  createdByUserId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  type: string;
  frequency: string;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Mapper entre domaine RecurringEntry et representation externe. */
export class RecurringEntryMapper {
  static toResponse(entry: RecurringEntry): RecurringEntryResponse {
    return {
      id: entry.id!,
      groupId: entry.groupId,
      createdByUserId: entry.createdByUserId,
      categoryId: entry.categoryId,
      description: entry.description,
      amount: Number(entry.amount),
      type: entry.type,
      frequency: entry.frequency,
      dayOfMonth: entry.dayOfMonth,
      dayOfWeek: entry.dayOfWeek,
      startDate:
        entry.startDate instanceof Date
          ? entry.startDate.toISOString().slice(0, 10)
          : String(entry.startDate),
      endDate: entry.endDate
        ? entry.endDate instanceof Date
          ? entry.endDate.toISOString().slice(0, 10)
          : String(entry.endDate)
        : null,
      isActive: entry.isActive,
      createdAt: entry.createdAt?.toISOString() ?? '',
    };
  }
}
