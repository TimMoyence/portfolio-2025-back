/** Entree de la cheatsheet : un outil IA avec ses metadonnees. */
export interface CheatsheetEntry {
  tool: string;
  category: string;
  price: string;
  url: string;
  tip: string;
  decision: string;
  alreadyUsed: boolean;
}

/** Entree de prompt personnalise par niveau et categorie. */
export interface PromptEntry {
  category: string;
  title: string;
  level: 'debutant' | 'intermediaire' | 'avance';
  prompt: string;
  tool: string;
}

/** Etape individuelle dans un workflow automatise. */
export interface WorkflowStep {
  step: number;
  action: string;
  tool: string;
  detail: string;
}

/** Workflow complet avec ses etapes et ses outils. */
export interface WorkflowEntry {
  title: string;
  description: string;
  setupTime: string;
  monthlyCost: number;
  steps: WorkflowStep[];
  tools: string[];
}

/** Template pret a l'emploi avec budget minimum requis. */
export interface TemplateEntry {
  name: string;
  platform: string;
  url: string;
  description: string;
  minBudget: number;
}

/** Contenu complet du guide personnalise genere pour l'utilisateur. */
export interface ToolkitContent {
  recap: {
    firstName: string;
    aiLevel: string | null;
    sector: string | null;
    budgetTier: string | null;
  };
  cheatsheet: CheatsheetEntry[];
  prompts: PromptEntry[];
  workflows: WorkflowEntry[];
  templates: TemplateEntry[];
  generatedPrompt: string | null;
}
