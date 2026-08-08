export interface CheatsheetEntry {
  tool: string;
  category: string;
  price: string;
  url: string;
  tip: string;
  decision: string;
  alreadyUsed: boolean;
}

export interface PromptEntry {
  category: string;
  title: string;
  level: 'debutant' | 'intermediaire' | 'avance';
  prompt: string;
  tool: string;
  description?: string;
  example?: string;
  tip?: string;
}

interface WorkflowStep {
  step: number;
  action: string;
  tool: string;
  detail: string;
}

export interface WorkflowEntry {
  title: string;
  description: string;
  setupTime: string;
  monthlyCost: number;
  steps: WorkflowStep[];
  tools: string[];
}

export interface TemplateEntry {
  name: string;
  platform: string;
  url: string;
  description: string;
  minBudget: number;
}

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
