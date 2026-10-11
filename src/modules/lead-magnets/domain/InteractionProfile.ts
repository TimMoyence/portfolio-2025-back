export const AI_LEVELS = ['debutant', 'intermediaire', 'avance'] as const;

export type AiLevel = (typeof AI_LEVELS)[number];

export const BUDGET_TIERS = ['0', '60', '120'] as const;

export type BudgetTier = (typeof BUDGET_TIERS)[number];

export interface InteractionProfile {
  aiLevel: AiLevel | null;
  toolsAlreadyUsed: string[];
  budgetTier: BudgetTier | null;
  sector: string | null;
  generatedPrompt: string | null;
}
