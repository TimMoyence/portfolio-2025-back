export interface InteractionProfile {
  aiLevel: 'debutant' | 'intermediaire' | 'avance' | null;
  toolsAlreadyUsed: string[];
  budgetTier: '0' | '60' | '120' | null;
  sector: string | null;
  generatedPrompt: string | null;
}
