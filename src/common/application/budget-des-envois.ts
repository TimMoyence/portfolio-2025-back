export const BUDGET_DES_ENVOIS = Symbol('BUDGET_DES_ENVOIS');

export interface BudgetDesEnvois {
  restantPourLaDiffusion(maintenant: Date): Promise<number>;
}
