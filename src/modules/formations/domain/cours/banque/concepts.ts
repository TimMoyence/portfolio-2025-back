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

export const CONCEPTS_DU_B2_02 = [
  'serie-statistique',
  'moyenne',
  'mediane',
  'quartiles',
  'dispersion',
  'ecart-type',
  'boite-a-moustaches',
  'histogramme',
  'choix-du-resume',
  'nuage-de-points',
  'correlation',
  'ajustement-affine',
  'prevision',
] as const;

export const CONCEPTS_DU_B2_03 = [
  'proposition',
  'connecteur',
  'negation',
  'quantificateur',
] as const;

export const CONCEPTS_DU_B2_04 = [
  'suite-arithmetique',
  'suite-geometrique',
  'algorithme-de-seuil',
  'somme-de-termes',
] as const;

export const CONCEPTS = [
  ...CONCEPTS_DU_B2_01,
  ...CONCEPTS_DU_B2_02,
  ...CONCEPTS_DU_B2_03,
  ...CONCEPTS_DU_B2_04,
] as const;

export type ConceptId = (typeof CONCEPTS)[number];
