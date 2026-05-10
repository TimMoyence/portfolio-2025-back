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
  delete(id: string): Promise<void>;
  /** Liste les couples (month, year) distincts ou des entrees existent pour un groupe, ordonne le plus recent en premier. */
  findDistinctMonths(
    groupId: string,
  ): Promise<Array<{ month: number; year: number }>>;
}
