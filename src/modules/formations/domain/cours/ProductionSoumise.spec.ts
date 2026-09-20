import {
  buildCoursAvecProductions,
  PLAN_DE_CLASSEMENT_TEST,
} from '../../../../../test/factories/cours.factory';
import {
  ProductionInvalideError,
  ProductionVideError,
} from '../errors/FormationErrors';
import {
  confusionDominante,
  corrigerProduction,
  ecranDeProduction,
  normaliserProduction,
} from './ProductionSoumise';
import type { EcranDeProduction } from './ProductionSoumise';

const COURS = buildCoursAvecProductions();

function cible(questionId: string): EcranDeProduction {
  const trouve = ecranDeProduction(COURS, questionId);
  if (trouve === null) {
    throw new Error(`production absente du cours de test : ${questionId}`);
  }
  return trouve;
}

const FEUILLE = cible('Q-TEST-FEUILLE');
const CLASSEMENT = cible('Q-TEST-CLASSEMENT');
const TABLEAU = cible('Q-TEST-TABLEAU');

describe('ecranDeProduction', () => {
  it('rend l ecran, la question et son rang', () => {
    expect(FEUILLE.ecran.id).toBe('E-FEUILLE');
    expect(FEUILLE.question.type).toBe('feuille');
    expect(FEUILLE.rang).toBe(COURS.ecrans.length - 3);
  });

  it('rend null pour une question qui n est pas une production', () => {
    expect(ecranDeProduction(COURS, 'Q-TEST-NUM')).toBeNull();
  });
});

describe('normaliserProduction', () => {
  it('refuse une production dont le type ne correspond pas a la question', () => {
    expect(() => {
      normaliserProduction(FEUILLE, { type: 'classement', classement: {} });
    }).toThrow(ProductionInvalideError);
  });

  it('retire les cellules verrouillees de la feuille envoyee', () => {
    const normalisee = normaliserProduction(FEUILLE, {
      type: 'feuille',
      cellules: { D2: '=(C2-B2)/B2', A1: 'Canal piraté' },
    });

    expect(normalisee).toEqual({
      type: 'feuille',
      cellules: { D2: '=(C2-B2)/B2' },
    });
  });

  it('refuse une cellule hors de la grille du plan', () => {
    expect(() => {
      normaliserProduction(FEUILLE, {
        type: 'feuille',
        cellules: { Z99: '=1' },
      });
    }).toThrow(ProductionInvalideError);
  });

  it('refuse une feuille sans aucune saisie utile', () => {
    expect(() => {
      normaliserProduction(FEUILLE, {
        type: 'feuille',
        cellules: { D2: '   ' },
      });
    }).toThrow(ProductionVideError);
  });

  it('accepte « je ne sais pas » sans saisie', () => {
    expect(
      normaliserProduction(FEUILLE, { type: 'feuille', neSaitPas: true }),
    ).toEqual({ type: 'feuille', neSaitPas: true });
  });

  it('refuse une carte absente du plan', () => {
    expect(() => {
      normaliserProduction(CLASSEMENT, {
        type: 'classement',
        classement: { 'carte-inventee': 'valeur' },
      });
    }).toThrow(ProductionInvalideError);
  });

  it('refuse une categorie absente du plan', () => {
    expect(() => {
      normaliserProduction(CLASSEMENT, {
        type: 'classement',
        classement: { 'ca-2025': 'categorie-inventee' },
      });
    }).toThrow(ProductionInvalideError);
  });

  it('accepte un classement conforme au plan', () => {
    const classement = Object.fromEntries(
      PLAN_DE_CLASSEMENT_TEST.cartes.map((carte) => [carte.id, 'valeur']),
    );

    expect(
      normaliserProduction(CLASSEMENT, { type: 'classement', classement }),
    ).toEqual({ type: 'classement', classement });
  });

  it('refuse une saisie de tableau hors du plan', () => {
    expect(() => {
      normaliserProduction(TABLEAU, {
        type: 'tableau',
        saisies: [{ rang: 9, cle: 'prix', valeur: 21.6 }],
      });
    }).toThrow(ProductionInvalideError);
  });

  it('refuse une saisie de tableau sur une colonne qui n est pas une saisie', () => {
    expect(() => {
      normaliserProduction(TABLEAU, {
        type: 'tableau',
        saisies: [{ rang: 0, cle: 'taux', valeur: 8 }],
      });
    }).toThrow(ProductionInvalideError);
  });

  it('refuse deux saisies pour la meme case', () => {
    expect(() => {
      normaliserProduction(TABLEAU, {
        type: 'tableau',
        saisies: [
          { rang: 0, cle: 'prix', valeur: 21.6 },
          { rang: 0, cle: 'prix', valeur: 22 },
        ],
      });
    }).toThrow(ProductionInvalideError);
  });

  it('refuse un tableau sans aucune saisie', () => {
    expect(() => {
      normaliserProduction(TABLEAU, { type: 'tableau', saisies: [] });
    }).toThrow(ProductionVideError);
  });
});

describe('corrigerProduction', () => {
  it('corrige la feuille et rend un detail par cellule attendue', () => {
    const verdict = corrigerProduction(
      FEUILLE.question.corrige,
      {
        type: 'feuille',
        cellules: { D2: '=(C2-B2)/B2', D3: '=(C3-B3)/B3' },
      },
      FEUILLE,
    );

    expect(verdict.details.map((detail) => detail.cle)).toEqual(['D2', 'D3']);
    expect(verdict.score).toBeGreaterThan(0);
  });

  it('rend un score nul et aucun detail pour « je ne sais pas »', () => {
    expect(
      corrigerProduction(
        FEUILLE.question.corrige,
        { type: 'feuille', neSaitPas: true },
        FEUILLE,
      ),
    ).toEqual({ correcte: false, score: 0, details: [] });
  });

  it('corrige un classement carte par carte', () => {
    const verdict = corrigerProduction(
      CLASSEMENT.question.corrige,
      {
        type: 'classement',
        classement: { 'ca-2025': 'valeur', inflation: 'taux' },
      },
      CLASSEMENT,
    );

    expect(verdict.details).toEqual([
      { cle: 'ca-2025', juste: true, confusion: null },
      {
        cle: 'inflation',
        juste: false,
        confusion: 'unite-manquante-ignoree',
      },
    ]);
    expect(verdict.score).toBe(0.5);
    expect(verdict.correcte).toBe(false);
  });

  it('corrige un tableau ligne par ligne et reconnait le piege', () => {
    const verdict = corrigerProduction(
      TABLEAU.question.corrige,
      {
        type: 'tableau',
        saisies: [
          { rang: 0, cle: 'prix', valeur: 21.6 },
          { rang: 1, cle: 'prix', valeur: 20.6 },
        ],
      },
      TABLEAU,
    );

    expect(verdict.details).toEqual([
      { cle: '0:prix', juste: true, confusion: null },
      {
        cle: '1:prix',
        juste: false,
        confusion: 'taux-successifs-additionnes',
      },
    ]);
  });
});

describe('confusionDominante', () => {
  it('rend null quand aucune confusion n est relevee', () => {
    expect(
      confusionDominante([{ cle: 'D2', juste: true, confusion: null }]),
    ).toBeNull();
  });

  it('rend la confusion la plus frequente du detail', () => {
    expect(
      confusionDominante([
        { cle: 'D2', juste: false, confusion: 'base-arrivee' },
        {
          cle: 'D3',
          juste: false,
          confusion: 'taux-valeur-facteur-cent',
        },
        {
          cle: 'D4',
          juste: false,
          confusion: 'taux-valeur-facteur-cent',
        },
      ]),
    ).toBe('taux-valeur-facteur-cent');
  });
});
