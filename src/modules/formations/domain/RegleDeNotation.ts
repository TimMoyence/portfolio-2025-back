import type { RegleDeNotation } from './contrats/contrat-de-l-api';

export type { RegleDeNotation } from './contrats/contrat-de-l-api';

export const REGLE_DE_NOTATION: RegleDeNotation = Object.freeze({
  statistiquesSurQuestionsNotees: true,
  neSaitPasCompteCommeReponse: true,
  pointsNonReponse: 0,
  reponsesLibresNotees: false,
  seuilQuestionProbleme: 0.7,
});
