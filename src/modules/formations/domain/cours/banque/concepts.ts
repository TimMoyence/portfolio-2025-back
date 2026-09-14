export const CONCEPTS = [
  'proportion',
  'pourcentage',
  'taux-evolution',
  'coefficient-multiplicateur',
  'evolutions-successives',
  'evolution-reciproque',
] as const;

export type ConceptId = (typeof CONCEPTS)[number];
