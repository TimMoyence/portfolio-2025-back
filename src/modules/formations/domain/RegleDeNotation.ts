export interface RegleDeNotation {
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
