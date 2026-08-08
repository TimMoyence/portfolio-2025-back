interface PollInteraction {
  type: 'poll';
  question: string;
  options: string[];
  multiSelect?: boolean;
}

type PresentInteraction = PollInteraction;

interface ReflectionInteraction {
  type: 'reflection';
  question: string;
  placeholder: string;
  rows?: number;
}

type ScrollInteraction = ReflectionInteraction;

export interface SlideInteractions {
  present?: PresentInteraction[];
  scroll?: ScrollInteraction[];
}

export interface PresentationInteractions {
  slug: string;
  interactions: Record<string, SlideInteractions>;
}
