import { findQuestion, pickFreeSeed, solutionFor } from './Bareme';
import type { Bareme } from './Bareme';

const bareme: Bareme = {
  version: 1,
  questions: [
    {
      id: 'Q-CAP-03',
      type: 'numeric',
      concept: 'capitalisation',
      tolerance: { type: 'relative', valeur: 0.005 },
      noteCompte: true,
    },
  ],
  tirages: [
    {
      seed: 1001,
      solutions: {
        'Q-CAP-03': {
          valeur: 1338.23,
          pieges: [{ valeur: 1300, misconception: 'interet-simple' }],
        },
      },
    },
    { seed: 1002, solutions: { 'Q-CAP-03': { valeur: 1500, pieges: [] } } },
  ],
};

describe('findQuestion', () => {
  it('retrouve une question par son identifiant', () => {
    expect(findQuestion(bareme, 'Q-CAP-03')?.concept).toBe('capitalisation');
  });

  it('retourne null pour un identifiant inconnu', () => {
    expect(findQuestion(bareme, 'Q-INCONNU')).toBeNull();
  });
});

describe('solutionFor', () => {
  it('retourne la solution du tirage demande', () => {
    expect(solutionFor(bareme, 1002, 'Q-CAP-03')?.valeur).toBe(1500);
  });

  it('retourne null pour un seed absent', () => {
    expect(solutionFor(bareme, 9999, 'Q-CAP-03')).toBeNull();
  });
});

describe('pickFreeSeed', () => {
  it('retourne un seed non attribue', () => {
    expect(pickFreeSeed(bareme, [1001])).toBe(1002);
  });

  it('retourne null quand tous les seeds sont pris', () => {
    expect(pickFreeSeed(bareme, [1001, 1002])).toBeNull();
  });

  it('retourne le premier seed sur une session vide', () => {
    expect(pickFreeSeed(bareme, [])).toBe(1001);
  });
});
