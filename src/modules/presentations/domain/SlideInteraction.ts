export interface PollInteraction {
  type: 'poll';
  question: string;
  options: string[];
  multiSelect?: boolean;
}

export type PresentInteraction = PollInteraction;

export interface ReflectionInteraction {
  type: 'reflection';
  question: string;
  placeholder: string;
  rows?: number;
}

export type ScrollInteraction = ReflectionInteraction;

export interface SlideInteractions {
  present?: PresentInteraction[];
  scroll?: ScrollInteraction[];
}

export interface PresentationInteractions {
  slug: string;
  interactions: Record<string, SlideInteractions>;
}
