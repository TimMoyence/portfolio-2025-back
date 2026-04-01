import type { BudgetCategory } from './BudgetCategory';

/** Port de persistance pour les categories de budget. */
export interface IBudgetCategoryRepository {
  create(data: BudgetCategory): Promise<BudgetCategory>;
  findByGroupId(groupId: string): Promise<BudgetCategory[]>;
  findDefaults(): Promise<BudgetCategory[]>;
  findById(id: string): Promise<BudgetCategory | null>;
}
