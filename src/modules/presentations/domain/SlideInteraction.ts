export interface PollInteraction {
  type: 'poll';
  question: string;
  options: string[];
  multiSelect?: boolean;
}

export interface CountdownInteraction {
  type: 'countdown';
  label: string;
  durationSeconds: number;
}

export type PresentInteraction = PollInteraction | CountdownInteraction;

export interface ReflectionInteraction {
  type: 'reflection';
  question: string;
  placeholder: string;
  rows?: number;
}

export interface ChecklistInteraction {
  type: 'checklist';
  question: string;
  items: string[];
}

export interface SelfRatingInteraction {
  type: 'self-rating';
  question: string;
  min: number;
  max: number;
  labels: { min: string; max: string };
}

export interface PromptBuilderInteraction {
  type: 'prompt-builder';
  context: string;
  promptTemplate: string;
  placeholder: string;
  ctaLabel?: string;
}

export type ScrollInteraction =
  | ReflectionInteraction
  | ChecklistInteraction
  | SelfRatingInteraction
  | PromptBuilderInteraction;

export interface SlideInteractions {
  present?: PresentInteraction[];
  scroll?: ScrollInteraction[];
}

export interface PresentationInteractions {
  slug: string;
  interactions: Record<string, SlideInteractions>;
}
