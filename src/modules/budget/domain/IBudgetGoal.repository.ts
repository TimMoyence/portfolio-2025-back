import type { BudgetGoal } from './BudgetGoal';

/** Champs editables d'un BudgetGoal lors d'un update partiel. */
export type BudgetGoalUpdatePatch = Partial<
  Pick<
    BudgetGoal,
    'name' | 'kind' | 'targetAmount' | 'categoryId' | 'deadline' | 'isActive'
  >
>;

/** Port de persistance des objectifs de budget. */
export interface IBudgetGoalRepository {
  /** Persiste un nouvel objectif et retourne sa version persistee. */
  create(goal: BudgetGoal): Promise<BudgetGoal>;

  /** Retourne un objectif par son identifiant ou null si absent. */
  findById(id: string): Promise<BudgetGoal | null>;

  /** Liste les objectifs d'un groupe. */
  findByGroupId(groupId: string): Promise<BudgetGoal[]>;

  /** Applique un patch partiel et retourne la version a jour. */
  update(id: string, patch: BudgetGoalUpdatePatch): Promise<BudgetGoal>;

  /** Supprime un objectif par identifiant. */
  delete(id: string): Promise<void>;
}
