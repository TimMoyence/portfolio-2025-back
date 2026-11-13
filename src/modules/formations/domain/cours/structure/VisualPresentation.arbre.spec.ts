import { parseVisualPresentation } from './VisualPresentation';

type Probabilite = number | '?';

interface Branche {
  readonly evenement: string;
  readonly probabilite: Probabilite;
  readonly branches?: readonly Branche[];
}

const feuilles = (
  premiere: Probabilite,
  seconde: Probabilite,
): readonly Branche[] => [
  { evenement: 'R', probabilite: premiere },
  { evenement: 'R̄', probabilite: seconde },
];

const arbre = (branches: readonly Branche[]) => ({
  renderer: 'arbre',
  props: {
    title: 'Pluie et retard',
    branches,
    description:
      'Arbre pondéré à deux générations : P puis P̄, puis R ou R̄ sous chacune.',
  },
});

const ARBRE_JUSTE: readonly Branche[] = [
  { evenement: 'P', probabilite: 0.35, branches: feuilles(0.24, 0.76) },
  { evenement: 'P̄', probabilite: 0.65, branches: feuilles(0.08, 0.92) },
];

const refusDe = (branches: readonly Branche[]): string => {
  try {
    parseVisualPresentation(arbre(branches));
  } catch (erreur) {
    return String(erreur);
  }
  return 'accepté';
};

describe('rendu arbre pondéré (B2-09)', () => {
  it('ARB-01 publie un arbre à deux générations, chaque branche portant sa probabilité', () => {
    expect(parseVisualPresentation(arbre(ARBRE_JUSTE))).toEqual(
      arbre(ARBRE_JUSTE),
    );
  });

  it('ARB-03 accepte un nœud 0,7 / 0,2 / 0,1 dans tout ordre de ses branches', () => {
    const troisBranches = (ordre: readonly number[]): readonly Branche[] =>
      ordre.map((probabilite, rang) => ({
        evenement: `E${rang + 1}`,
        probabilite,
      }));

    expect(refusDe(troisBranches([0.1, 0.2, 0.7]))).toBe('accepté');
    expect(refusDe(troisBranches([0.7, 0.2, 0.1]))).toBe('accepté');
  });

  it('ARB-04 accepte un « ? » par nœud quand la somme connue reste sous 1', () => {
    expect(
      refusDe([
        { evenement: 'P', probabilite: 0.35, branches: feuilles(0.24, '?') },
        { evenement: 'P̄', probabilite: '?', branches: feuilles(0.08, 0.92) },
      ]),
    ).toBe('accepté');
  });

  it('ARB-01 refuse un nœud dont les branches ne somment pas à 1, en nommant le nœud', () => {
    expect(
      refusDe([
        { evenement: 'P', probabilite: 0.35, branches: feuilles(0.24, 0.66) },
        { evenement: 'P̄', probabilite: 0.65, branches: feuilles(0.08, 0.92) },
      ]),
    ).toContain('nœud « P » : ses branches somment à 0,9 au lieu de 1');
  });

  it('ARB-04 refuse deux « ? » sur un même nœud, en nommant le nœud', () => {
    expect(
      refusDe([
        { evenement: 'P', probabilite: 0.35, branches: feuilles('?', '?') },
        { evenement: 'P̄', probabilite: 0.65, branches: feuilles(0.08, 0.92) },
      ]),
    ).toContain('nœud « P » : deux branches « ? », une seule se déduit');
  });

  it('ARB-04 refuse un « ? » dont la somme connue atteint déjà 1, en nommant le nœud', () => {
    expect(
      refusDe([
        { evenement: 'P', probabilite: 1, branches: feuilles(0.24, 0.76) },
        { evenement: 'P̄', probabilite: '?', branches: feuilles(0.08, 0.92) },
      ]),
    ).toContain(
      'nœud « racine » : la somme connue atteint 1, le « ? » vaudrait 0',
    );
  });

  it.each([
    ['nulle', 0],
    ['négative', -0.2],
    ['supérieure à 1', 1.2],
  ])(
    'ARB-04 refuse une branche %s, en nommant le nœud et la branche',
    (_cas, probabilite) => {
      expect(
        refusDe([
          {
            evenement: 'P',
            probabilite: 0.35,
            branches: feuilles(probabilite, 1 - probabilite),
          },
          { evenement: 'P̄', probabilite: 0.65, branches: feuilles(0.08, 0.92) },
        ]),
      ).toContain(
        'nœud « P », branche « R » : une probabilité de branche est strictement entre 0 et 1',
      );
    },
  );

  it('ARB-04 refuse un nœud d’une seule branche, en nommant le nœud', () => {
    expect(
      refusDe([
        {
          evenement: 'P',
          probabilite: 0.35,
          branches: [{ evenement: 'R', probabilite: '?' }],
        },
        { evenement: 'P̄', probabilite: 0.65, branches: feuilles(0.08, 0.92) },
      ]),
    ).toContain('nœud « P » : un nœud porte au moins deux branches');
  });
});
