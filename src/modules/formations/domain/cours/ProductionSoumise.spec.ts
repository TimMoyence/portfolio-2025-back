import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import { CONTENUS } from '../../../../../test/factories/contenus-publies';
import {
  buildCoursAvecProductions,
  PLAN_DE_CLASSEMENT_TEST,
} from '../../../../../test/factories/cours.factory';
import { PLAN_TABLE_DE_VERITE } from '../../../../../test/factories/ecrans-stockes.factory';
import { detailsDeFeuilleSansReponse } from '../../../../../test/factories/formation.factory';
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
import type { CorrigeProduction } from './Corrige';
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
const TABLE_DE_VERITE = tableauSurLePlan(PLAN_TABLE_DE_VERITE);

function tableauSurLePlan(
  plan: typeof PLAN_TABLE_DE_VERITE,
): EcranDeProduction {
  if (TABLEAU.ecran.brique !== 'fp-table-build') {
    throw new Error('le cours de test doit porter un tableau');
  }
  return {
    ...TABLEAU,
    ecran: {
      ...TABLEAU.ecran,
      proprietes: {
        ...TABLEAU.ecran.proprietes,
        plan: structuredClone(plan),
      },
    },
  };
}

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

  it.each(['A0', 'A01', 'AA1', 'D2 ', 'D1000', '__proto__'])(
    'refuse un nom qui n est pas une reference de cellule : « %s »',
    (nom) => {
      expect(() => {
        normaliserProduction(FEUILLE, {
          type: 'feuille',
          cellules: { [nom]: '=1' },
        });
      }).toThrow(ProductionInvalideError);
    },
  );

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

  it.each([
    [
      'une saisie de tableau hors du plan',
      [{ rang: 9, cle: 'prix', valeur: 21.6 }],
    ],
    [
      'une saisie de tableau sur une colonne qui n est pas une saisie',
      [{ rang: 0, cle: 'taux', valeur: 8 }],
    ],
    [
      'deux saisies pour la meme case',
      [
        { rang: 0, cle: 'prix', valeur: 21.6 },
        { rang: 0, cle: 'prix', valeur: 22 },
      ],
    ],
  ])('refuse %s', (_cas, saisies) => {
    expect(() => {
      normaliserProduction(TABLEAU, { type: 'tableau', saisies });
    }).toThrow(ProductionInvalideError);
  });

  it.each([0.5, 7, -1])(
    'refuse %s dans une case de verite, qui n accepte que 0 ou 1',
    (valeur) => {
      expect(() => {
        normaliserProduction(TABLE_DE_VERITE, {
          type: 'tableau',
          saisies: [{ rang: 0, cle: 'pEtQ', valeur }],
        });
      }).toThrow(ProductionInvalideError);
    },
  );

  it('accepte V ou F dans une case de verite', () => {
    const saisies = [
      { rang: 0, cle: 'pEtQ', valeur: 1 },
      { rang: 1, cle: 'pEtQ', valeur: 0 },
    ];

    expect(
      normaliserProduction(TABLE_DE_VERITE, { type: 'tableau', saisies }),
    ).toEqual({ type: 'tableau', saisies });
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

  it('QA-06 · corrige « je ne sais pas » a zero, chaque cellule attendue fausse et sans confusion', () => {
    expect(
      corrigerProduction(
        FEUILLE.question.corrige,
        { type: 'feuille', neSaitPas: true },
        FEUILLE,
      ),
    ).toEqual({
      correcte: false,
      score: 0,
      details: detailsDeFeuilleSansReponse(),
    });
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

describe('QA-06 · « je ne sais pas » sur chaque production des cours servis', () => {
  const PRODUCTIONS = CONTENUS.flatMap((contenu) => {
    const cours = buildCoursDuContenu(contenu);
    return cours.ecrans.flatMap((ecran) => {
      const trouvee =
        'production' in ecran
          ? ecranDeProduction(cours, ecran.production.id)
          : null;
      return trouvee === null ? [] : [trouvee];
    });
  });

  function clesDuCorrige(corrige: CorrigeProduction): readonly string[] {
    switch (corrige.type) {
      case 'feuille':
        return corrige.attendus.map(({ reference }) => reference);
      case 'tableau':
        return corrige.attendus.map(({ rang, cle }) => `${rang}:${cle}`);
      case 'classement':
        return corrige.attendus.map(({ carteId }) => carteId);
      default:
        return [];
    }
  }

  it('trouve des feuilles, des tableaux et des classements', () => {
    expect(
      new Set(PRODUCTIONS.map(({ question }) => question.corrige.type)),
    ).toEqual(new Set(['feuille', 'tableau', 'classement']));
  });

  it.each(PRODUCTIONS.map((cible) => [cible.question.id, cible] as const))(
    '%s : vaut zero, chaque cle du corrige fausse et sans confusion',
    (_, cible) => {
      const corrige = cible.question.corrige;
      if (corrige.type === 'enigme') {
        throw new Error('une production ne porte pas un corrige d enigme');
      }
      const verdict = corrigerProduction(
        corrige,
        { type: corrige.type, neSaitPas: true },
        cible,
      );
      const parCle = (
        gauche: { readonly cle: string },
        droite: { readonly cle: string },
      ) => gauche.cle.localeCompare(droite.cle);

      expect(verdict.correcte).toBe(false);
      expect(verdict.score).toBe(0);
      expect([...verdict.details].sort(parCle)).toEqual(
        clesDuCorrige(corrige)
          .map((cle) => ({ cle, juste: false, confusion: null }))
          .sort(parCle),
      );
    },
  );
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
