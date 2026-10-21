import type { RegleDeNotation } from './contrats/contrat-de-l-api';

export type { RegleDeNotation } from './contrats/contrat-de-l-api';

export const REGLE_DE_NOTATION: RegleDeNotation = Object.freeze({
  statistiquesSurQuestionsNotees: true,
  noteMax: 20,
  partCohorteReference: 0.2,
  ratioSeuilValidation: 0.4,
  neSaitPasCompteCommeReponse: true,
  pointsNonReponse: 0,
  reponsesLibresNotees: false,
  seuilQuestionProbleme: 0.7,
  decimalesStatistiques: 2,
});

export const DECIMALES_DE_LA_NOTE = 1;
