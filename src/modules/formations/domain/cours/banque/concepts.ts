export const CONCEPTS_DU_B2_01 = [
  'proportion',
  'pourcentage',
  'taux-evolution',
  'coefficient-multiplicateur',
  'evolutions-successives',
  'evolution-reciproque',
  'taux-moyen',
  'indice-base-100',
  'point-de-pourcentage',
  'moyenne-ponderee',
  'lecture-graphique',
  'controle-coherence',
  'contrat-de-lecture',
  'tableur',
] as const;

export const CONCEPTS = [...CONCEPTS_DU_B2_01] as const;

export type ConceptId = (typeof CONCEPTS)[number];
