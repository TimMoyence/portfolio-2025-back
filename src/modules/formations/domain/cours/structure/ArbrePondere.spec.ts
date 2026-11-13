import {
  avecLesProduits,
  BRANCHE_A_DEDUIRE,
  produitDuChemin,
  type BrancheSaisie,
} from './ArbrePondere';
import { parseVisualPresentation } from './VisualPresentation';

const PLUIE_ET_RETARD: readonly BrancheSaisie[] = [
  {
    evenement: 'P',
    probabilite: 0.35,
    branches: [
      { evenement: 'R', probabilite: 0.24 },
      { evenement: 'R̄', probabilite: 0.76 },
    ],
  },
  {
    evenement: 'P̄',
    probabilite: '?',
    branches: [
      { evenement: 'R', probabilite: 0.08 },
      { evenement: 'R̄', probabilite: '?' },
    ],
  },
];

const publier = (branches: unknown) =>
  parseVisualPresentation({
    renderer: 'arbre',
    props: {
      title: 'Pluie et retard',
      branches,
      description:
        'Arbre pondéré à deux générations, produits en bout de chemin.',
    },
  });

const refusDe = (branches: unknown): string => {
  try {
    publier(branches);
  } catch (erreur) {
    return String(erreur);
  }
  return 'accepté';
};

const produits = (
  branches: readonly { branches?: readonly { produit?: unknown }[] }[],
) =>
  branches.flatMap((branche) =>
    (branche.branches ?? []).map(({ produit }) => produit),
  );

describe('produit d’un chemin', () => {
  it.each([
    [0.1, 0.2, 0.02],
    [0.7, 0.04, 0.028],
    [1, 0.35, 0.35],
    [0, 0.8, 0],
    [0.123456, 0.654321, 0.08078],
  ])(
    'ARB-05 multiplie %p par %p et arrondit au millionième : %p',
    (premiere, seconde, produit) => {
      expect(produitDuChemin(premiere, seconde)).toBe(produit);
    },
  );

  it.each([
    [BRANCHE_A_DEDUIRE, 0.4],
    [0.4, BRANCHE_A_DEDUIRE],
    [BRANCHE_A_DEDUIRE, BRANCHE_A_DEDUIRE],
  ] as const)(
    'ARB-05 laisse à déduire le chemin %p × %p',
    (premiere, seconde) => {
      expect(produitDuChemin(premiere, seconde)).toBe(BRANCHE_A_DEDUIRE);
    },
  );
});

describe('produits d’un arbre pondéré', () => {
  it('ARB-05 calcule le produit de chaque chemin depuis ses branches, au millionième', () => {
    const [premiere] = avecLesProduits(PLUIE_ET_RETARD);

    expect(produits([premiere])).toEqual([0.084, 0.266]);
  });

  it('ARB-05 laisse blanc le produit d’un chemin qui traverse un « ? »', () => {
    const [, seconde] = avecLesProduits(PLUIE_ET_RETARD);

    expect(produits([seconde])).toEqual(['?', '?']);
  });

  it('ARB-05 publie l’arbre muni de ses produits calculés', () => {
    expect(refusDe(avecLesProduits(PLUIE_ET_RETARD))).toBe('accepté');
  });

  it('ARB-05 refuse un produit saisi qui contredit ses branches, en nommant le chemin', () => {
    const [premiere, seconde] = avecLesProduits(PLUIE_ET_RETARD);
    const faux = [
      {
        ...premiere,
        branches: [
          { evenement: 'R', probabilite: 0.24, produit: 0.1 },
          { evenement: 'R̄', probabilite: 0.76, produit: 0.266 },
        ],
      },
      seconde,
    ];

    expect(refusDe(faux)).toContain(
      'chemin « P → R » : le produit vaut 0,084, pas 0,1',
    );
  });

  it('ARB-05 refuse un nombre au bout d’un chemin qui traverse un « ? »', () => {
    const [premiere, seconde] = avecLesProduits(PLUIE_ET_RETARD);
    const devoile = [
      premiere,
      {
        ...seconde,
        branches: [
          { evenement: 'R', probabilite: 0.08, produit: 0.052 },
          { evenement: 'R̄', probabilite: '?', produit: '?' },
        ],
      },
    ];

    expect(refusDe(devoile)).toContain(
      'chemin « P̄ → R » : il traverse un « ? », son produit reste blanc',
    );
  });

  it('ARB-05 refuse des produits sur une partie seulement des chemins', () => {
    const [premiere] = avecLesProduits(PLUIE_ET_RETARD);

    expect(refusDe([premiere, PLUIE_ET_RETARD[1]])).toContain(
      'les produits s’affichent au bout de tous les chemins ou d’aucun',
    );
  });
});
