import type { BudgetEntry } from './BudgetEntry';

export interface BudgetEntryFilters {
  groupId: string;
  month?: number;
  year?: number;
  categoryId?: string;
}

/** Port de persistance pour les entrees de budget. */
export interface IBudgetEntryRepository {
  create(data: BudgetEntry): Promise<BudgetEntry>;
  createMany(data: BudgetEntry[]): Promise<BudgetEntry[]>;
  findByFilters(filters: BudgetEntryFilters): Promise<BudgetEntry[]>;
  findById(id: string): Promise<BudgetEntry | null>;
  update(id: string, data: Partial<BudgetEntry>): Promise<BudgetEntry>;
}
