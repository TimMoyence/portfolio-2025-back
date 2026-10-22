import { REGLE_DE_NOTATION } from './RegleDeNotation';

describe('REGLE_DE_NOTATION', () => {
  it('annonce la regle de completion et de reussite appliquee par le serveur, sans note sur 20', () => {
    expect(REGLE_DE_NOTATION).toEqual({
      statistiquesSurQuestionsNotees: true,
      neSaitPasCompteCommeReponse: true,
      pointsNonReponse: 0,
      reponsesLibresNotees: false,
      seuilQuestionProbleme: 0.7,
    });
  });

  it('ne se modifie pas a l execution', () => {
    expect(Object.isFrozen(REGLE_DE_NOTATION)).toBe(true);
  });
});
