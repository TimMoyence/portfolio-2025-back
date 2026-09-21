import type { TypeQuestion } from './contrats/cours';

export interface RegleDeNotation {
  readonly typesNotables: readonly TypeQuestion[];
  readonly productionCompteSi: 'au-moins-une-saisie';
  readonly statistiquesSurQuestionsNotees: boolean;
  readonly noteMax: number;
  readonly base: 'participation-relative-cohorte';
  readonly partCohorteReference: number;
  readonly ratioSeuilValidation: number;
  readonly neSaitPasCompteCommeReponse: boolean;
  readonly pointsNonReponse: number;
  readonly reponsesLibresNotees: boolean;
  readonly seuilQuestionProbleme: number;
  readonly decimalesStatistiques: number;
}

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
