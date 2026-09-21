import {
  buildCorrigeClassement,
  buildCorrigeDefi,
  buildCorrigeEnigme,
  buildCorrigeFeuille,
  buildCorrigeRevelation,
  buildCorrigeTableau,
  buildPlanFeuille,
} from '../../../../../test/factories/corriges.factory';
import {
  corrigeClassement,
  corrigeDefi,
  corrigeEnigme,
  corrigeFeuille,
  corrigeRevelation,
  corrigeTableau,
} from './CorrigeStocke';

const [ATTENDU_D2, ATTENDU_D3] = buildCorrigeFeuille().attendus;

describe('schémas zod des corrigés (§ 9.3.3)', () => {
  it.each([
    ['feuille', corrigeFeuille, buildCorrigeFeuille()],
    ['tableau', corrigeTableau, buildCorrigeTableau()],
    ['classement', corrigeClassement, buildCorrigeClassement()],
    ['enigme', corrigeEnigme, buildCorrigeEnigme()],
    ['defi', corrigeDefi, buildCorrigeDefi()],
    ['revelation', corrigeRevelation, buildCorrigeRevelation()],
  ] as const)('accepte un corrigé %s conforme', (_type, schema, corrige) => {
    expect(schema.safeParse(corrige).success).toBe(true);
  });

  describe('feuille', () => {
    it.each([
      [
        'un piège confondu avec la valeur attendue',
        buildCorrigeFeuille({
          attendus: [
            {
              ...ATTENDU_D2,
              pieges: [{ valeur: -0.17806, confusion: 'base-arrivee' }],
            },
          ],
        }),
      ],
      [
        'deux attendus pour la même cellule',
        buildCorrigeFeuille({ attendus: [ATTENDU_D2, ATTENDU_D2] }),
      ],
      [
        'une forme qui renvoie à une cellule sans attendu',
        buildCorrigeFeuille({
          attendus: [{ ...ATTENDU_D3, forme: { memeQue: 'E9' } }],
        }),
      ],
      [
        'une cellule attendue hors de la grille',
        buildCorrigeFeuille({ attendus: [{ ...ATTENDU_D2, reference: 'H2' }] }),
      ],
      [
        'une cellule attendue verrouillée',
        buildCorrigeFeuille({ attendus: [{ ...ATTENDU_D2, reference: 'C2' }] }),
      ],
      [
        'une cellule initiale hors de la grille',
        buildCorrigeFeuille({
          plan: buildPlanFeuille({ cellules: { Z99: 'x' } }),
        }),
      ],
      ['un seuil supérieur à 1', buildCorrigeFeuille({ seuilReussite: 1.2 })],
      [
        'une clé inconnue dans un attendu',
        {
          ...buildCorrigeFeuille(),
          attendus: [{ ...ATTENDU_D2, indice: 'aide' }],
        },
      ],
      [
        'une clé inconnue dans le plan recopié',
        {
          ...buildCorrigeFeuille(),
          plan: { ...buildPlanFeuille(), metadonnees: {} },
        },
      ],
    ])('refuse %s', (_cas, corrige) => {
      expect(corrigeFeuille.safeParse(corrige).success).toBe(false);
    });
  });

  describe('tableau', () => {
    it.each([
      [
        'un piège confondu avec la valeur attendue à la tolérance près',
        buildCorrigeTableau({
          attendus: [
            {
              rang: 0,
              cle: 'prix',
              valeur: 21.6,
              pieges: [
                { valeur: 21.605, confusion: 'taux-successifs-additionnes' },
              ],
            },
          ],
        }),
      ],
      [
        'deux attendus pour le même rang et la même clé',
        buildCorrigeTableau({
          attendus: [
            { rang: 0, cle: 'prix', valeur: 21.6, pieges: [] },
            { rang: 0, cle: 'prix', valeur: 22, pieges: [] },
          ],
        }),
      ],
    ])('refuse %s', (_cas, corrige) => {
      expect(corrigeTableau.safeParse(corrige).success).toBe(false);
    });
  });

  it('refuse un classement qui classe deux fois la même carte', () => {
    const [premier] = buildCorrigeClassement().attendus;

    expect(
      corrigeClassement.safeParse(
        buildCorrigeClassement({ attendus: [premier, premier] }),
      ).success,
    ).toBe(false);
  });

  it.each([
    [
      'un piège égal à la solution',
      buildCorrigeEnigme({
        pieges: [{ valeur: 23.42, confusion: 'moyenne-simple-des-taux' }],
      }),
    ],
    ['un fragment vide', buildCorrigeEnigme({ fragment: '' })],
    ['un rang négatif', buildCorrigeEnigme({ rang: -1 })],
  ])('refuse une énigme avec %s', (_cas, corrige) => {
    expect(corrigeEnigme.safeParse(corrige).success).toBe(false);
  });

  it('accepte une énigme à réponse textuelle', () => {
    expect(
      corrigeEnigme.safeParse(
        buildCorrigeEnigme({
          solution: { type: 'texte', acceptees: ['F004'] },
          pieges: [],
        }),
      ).success,
    ).toBe(true);
  });

  it.each([
    [
      'aucune stratégie fausse',
      buildCorrigeDefi({
        strategies: [{ id: 'axe', libelle: 'Lire l’axe.', fausse: false }],
      }),
    ],
    [
      'deux stratégies fausses',
      buildCorrigeDefi({
        strategies: [
          { id: 'a', libelle: 'A', fausse: true },
          { id: 'b', libelle: 'B', fausse: true },
        ],
      }),
    ],
    [
      'deux stratégies au même identifiant',
      buildCorrigeDefi({
        strategies: [
          { id: 'a', libelle: 'A', fausse: false },
          { id: 'a', libelle: 'B', fausse: true },
        ],
      }),
    ],
  ])('refuse un défi avec %s', (_cas, corrige) => {
    expect(corrigeDefi.safeParse(corrige).success).toBe(false);
  });

  it('refuse une révélation sans ligne', () => {
    expect(
      corrigeRevelation.safeParse({ ...buildCorrigeRevelation(), lignes: [] })
        .success,
    ).toBe(false);
  });
});
