import type { BudgetCategory } from './BudgetCategory';

/** Port de persistance pour les categories de budget. */
export interface IBudgetCategoryRepository {
  create(data: BudgetCategory): Promise<BudgetCategory>;
  findByGroupId(groupId: string): Promise<BudgetCategory[]>;
  findDefaults(): Promise<BudgetCategory[]>;
  findById(id: string): Promise<BudgetCategory | null>;
  /**
   * Retourne le clone par-groupe d'une categorie par defaut (matching
   * replaces_default_id), ou null s'il n'existe pas encore.
   */
  findCloneInGroup(
    groupId: string,
    defaultCategoryId: string,
  ): Promise<BudgetCategory | null>;
  update(id: string, data: Partial<BudgetCategory>): Promise<BudgetCategory>;
}
