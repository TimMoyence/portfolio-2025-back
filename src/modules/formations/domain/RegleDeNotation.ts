import type { RegleDeNotation } from 'portfolio-2025-partage/contrats';

export type { RegleDeNotation } from 'portfolio-2025-partage/contrats';

export const REGLE_DE_NOTATION: RegleDeNotation = Object.freeze({
  typesNotables: [
    'numeric',
    'vote',
    'feuille',
    'tableau',
    'classement',
  ] as const,
  productionCompteSi: 'au-moins-une-saisie',
  statistiquesSurQuestionsNotees: true,
  noteMax: 20,
  base: 'participation-relative-cohorte',
  partCohorteReference: 0.2,
  ratioSeuilValidation: 0.4,
  neSaitPasCompteCommeReponse: true,
  pointsNonReponse: 0,
  reponsesLibresNotees: false,
  seuilQuestionProbleme: 0.7,
  decimalesStatistiques: 2,
});

export const DECIMALES_DE_LA_NOTE = 1;
