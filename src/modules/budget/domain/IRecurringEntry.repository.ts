import type { RecurringEntry } from './RecurringEntry';

/** Port de persistance pour les entrees recurrentes de budget. */
export interface IRecurringEntryRepository {
  create(data: RecurringEntry): Promise<RecurringEntry>;
  findByGroupId(groupId: string): Promise<RecurringEntry[]>;
  findById(id: string): Promise<RecurringEntry | null>;
  update(id: string, data: Partial<RecurringEntry>): Promise<RecurringEntry>;
  delete(id: string): Promise<void>;
  findActiveByGroupId(groupId: string): Promise<RecurringEntry[]>;
}
