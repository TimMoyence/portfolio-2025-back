import { BudgetEntry } from '../../domain/BudgetEntry';

/** Mapper entre domaine BudgetEntry et representation externe. */
export class BudgetEntryMapper {
  static toResponse(entry: BudgetEntry) {
    return {
      id: entry.id,
      groupId: entry.groupId,
      createdByUserId: entry.createdByUserId,
      categoryId: entry.categoryId,
      date:
        entry.date instanceof Date
          ? entry.date.toISOString().slice(0, 10)
          : String(entry.date),
      description: entry.description,
      amount: Number(entry.amount),
      type: entry.type,
      state: entry.state,
      createdAt: entry.createdAt?.toISOString(),
    };
  }
}
