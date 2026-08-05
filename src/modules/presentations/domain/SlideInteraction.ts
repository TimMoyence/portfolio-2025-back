// ── Interactions mode Present (présentateur clique, audience regarde) ──

/** Sondage à main levée — le présentateur clique pour compter les votes */
export interface PollInteraction {
  type: 'poll';
  question: string;
  options: string[];
  multiSelect?: boolean;
}

/** Compte à rebours — pause dramatique */
export interface CountdownInteraction {
  type: 'countdown';
  label: string;
  durationSeconds: number;
}

export type PresentInteraction = PollInteraction | CountdownInteraction;

// ── Interactions mode Scroll (le lecteur interagit seul) ──

/** Question ouverte introspective */
export interface ReflectionInteraction {
  type: 'reflection';
  question: string;
  placeholder: string;
  rows?: number;
}

/** Checklist interactive */
export interface ChecklistInteraction {
  type: 'checklist';
  question: string;
  items: string[];
}

/** Échelle d'auto-évaluation */
export interface SelfRatingInteraction {
  type: 'self-rating';
  question: string;
  min: number;
  max: number;
  labels: { min: string; max: string };
}

/**
 * Mini-exercice live : matérialise un cas pratique en générant un
 * prompt prêt à copier après que l'audience saisit un paramètre
 * (`{{sector}}`). Substitution exécutée côté front, pas de transit
 * réseau de la valeur.
 */
export interface PromptBuilderInteraction {
  type: 'prompt-builder';
  /** Phrase de contexte / persona affichée en haut de l'exercice. */
  context: string;
  /** Template de prompt avec placeholder `{{sector}}`. */
  promptTemplate: string;
  /** Helper text affiché dans l'input. */
  placeholder: string;
  /** Libellé du bouton de copie ; défaut côté composant. */
  ctaLabel?: string;
}

export type ScrollInteraction =
  | ReflectionInteraction
  | ChecklistInteraction
  | SelfRatingInteraction
  | PromptBuilderInteraction;

/** Interactions attachées à une slide, indexées par mode d'affichage */
export interface SlideInteractions {
  present?: PresentInteraction[];
  scroll?: ScrollInteraction[];
}

/**
 * Interactions d'une présentation complète.
 * Map slideId → SlideInteractions.
 */
export interface PresentationInteractions {
  slug: string;
  interactions: Record<string, SlideInteractions>;
}
