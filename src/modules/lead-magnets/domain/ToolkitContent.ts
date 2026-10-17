export const AI_LEVELS = ['debutant', 'intermediaire', 'avance'] as const;

type AiLevel = (typeof AI_LEVELS)[number];

export interface CheatsheetEntry {
  tool: string;
  category: string;
  price: string;
  url: string;
  tip: string;
  decision: string;
}

export interface PromptEntry {
  category: string;
  title: string;
  level: AiLevel;
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
  };
  cheatsheet: CheatsheetEntry[];
  prompts: PromptEntry[];
  workflows: WorkflowEntry[];
  templates: TemplateEntry[];
}
