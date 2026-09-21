import { REGLE_DE_NOTATION } from './RegleDeNotation';

describe('REGLE_DE_NOTATION', () => {
  it('annonce la note de participation relative a la cohorte appliquee par le serveur', () => {
    expect(REGLE_DE_NOTATION).toEqual({
      typesNotables: ['numeric', 'vote', 'feuille', 'tableau', 'classement'],
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
  });

  it('note les productions comme les questions fermees, hors enigmes', () => {
    expect(REGLE_DE_NOTATION.typesNotables).toContain('feuille');
    expect(REGLE_DE_NOTATION.typesNotables).not.toContain('enigme');
  });

  it('ne se modifie pas a l execution', () => {
    expect(Object.isFrozen(REGLE_DE_NOTATION)).toBe(true);
  });
});
