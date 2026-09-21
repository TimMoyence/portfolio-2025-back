import type { Feuille, ResultatFormule } from './Formule';
import {
  evaluerCellule,
  evaluerExpression,
  evaluerFeuille,
  formeR1C1,
  FeuilleHorsLimitesError,
  LONGUEUR_MAX_FORMULE,
  NOMBRE_MAX_CELLULES,
  PROFONDEUR_MAX,
  surfaceDeFormule,
} from './Formule';

const REF = '#REF!';
const DIV = '#DIV/0!';
const NOM = '#NOM?';
const VALEUR = '#VALEUR!';

function feuille(
  cellules: Readonly<Record<string, string>>,
  lignes = 12,
  colonnes = 8,
): Feuille {
  return { lignes, colonnes, cellules };
}

function valeurs(
  resultats: ReadonlyMap<string, ResultatFormule>,
): Record<string, number | string> {
  return Object.fromEntries(
    [...resultats].map(([nom, resultat]) => [
      nom,
      resultat.erreur ?? resultat.valeur ?? Number.NaN,
    ]),
  );
}

function chaineDeDoublements(longueur: number): Feuille {
  const cellules: Record<string, string> = { A1: '1' };
  for (let rang = 2; rang <= longueur; rang += 1) {
    cellules[`A${rang}`] = `=A${rang - 1}+A${rang - 1}`;
  }
  return feuille(cellules, longueur, 1);
}

describe('evaluerFeuille', () => {
  it('évalue les formules d’une feuille et ignore les cellules vides', () => {
    const resultats = evaluerFeuille(
      feuille({ A1: '2', A2: '3', A3: '=A1+A2', A4: '   ', A5: '' }),
    );

    expect(valeurs(resultats)).toEqual({ A1: 2, A2: 3, A3: 5 });
  });

  it('lit la virgule décimale française, dans une saisie comme dans une formule', () => {
    const resultats = evaluerFeuille(feuille({ A1: '2,5', A2: '=A1*0,4' }));

    expect(valeurs(resultats)).toEqual({ A1: 2.5, A2: 1 });
  });

  it('signale un cycle par #REF! sur chacun de ses maillons', () => {
    const resultats = evaluerFeuille(
      feuille({ A1: '=A2', A2: '=A3', A3: '=A1' }),
    );

    expect(valeurs(resultats)).toEqual({ A1: REF, A2: REF, A3: REF });
  });

  it('signale une division par une cellule vide par #DIV/0!', () => {
    expect(valeurs(evaluerFeuille(feuille({ A1: '=1/B1' })))).toEqual({
      A1: DIV,
    });
  });

  it('signale une référence hors grille par #REF!', () => {
    expect(valeurs(evaluerFeuille(feuille({ A1: '=B1' }, 1, 1)))).toEqual({
      A1: REF,
    });
  });

  it('propage l’erreur d’une cellule à celles qui la citent', () => {
    const resultats = evaluerFeuille(
      feuille({ A1: '=1/0', A2: '=A1+1' }, 2, 1),
    );

    expect(valeurs(resultats)).toEqual({ A1: DIV, A2: DIV });
  });

  it('signale une fonction inconnue par #NOM? et du texte calculé par #VALEUR!', () => {
    const resultats = evaluerFeuille(
      feuille({ A1: 'Canal', A2: '=RACINE(4)', A3: '=A1+1' }),
    );

    expect(valeurs(resultats)).toEqual({ A1: VALEUR, A2: NOM, A3: VALEUR });
  });

  it('additionne une plage en ignorant ses cellules de texte', () => {
    const resultats = evaluerFeuille(
      feuille({ A1: 'Total', A2: '10', A3: '5', A4: '=SOMME(A1:A3)' }),
    );

    expect(valeurs(resultats).A4).toBe(15);
  });

  it('refuse du texte passé en argument direct à SOMME', () => {
    const resultats = evaluerFeuille(
      feuille({ A1: 'Total', A2: '=SOMME(A1)' }),
    );

    expect(valeurs(resultats).A2).toBe(VALEUR);
  });

  it('moyenne une plage vide de nombres par #DIV/0!', () => {
    const resultats = evaluerFeuille(
      feuille({ A1: 'Canal', A2: '=MOYENNE(A1:A1)' }),
    );

    expect(valeurs(resultats).A2).toBe(DIV);
  });

  it('accepte une plage écrite à l’envers et une plage figée', () => {
    const resultats = evaluerFeuille(
      feuille({
        A1: '1',
        A2: '2',
        B1: '=SOMME(A2:A1)',
        B2: '=SOMME($A$1:$A$2)',
      }),
    );

    expect(valeurs(resultats).B1).toBe(3);
    expect(valeurs(resultats).B2).toBe(3);
  });

  it('refuse une plage hors grille par #REF!', () => {
    const resultats = evaluerFeuille(feuille({ A1: '=SOMME(A1:A9)' }, 2, 1));

    expect(valeurs(resultats).A1).toBe(REF);
  });

  it('refuse une plage employée comme un nombre', () => {
    const resultats = evaluerFeuille(feuille({ A1: '1', B1: '=A1:A1+1' }));

    expect(valeurs(resultats).B1).toBe(VALEUR);
  });

  it('refuse une formule plus longue que la borne', () => {
    const trop = `=${'1+'.repeat(LONGUEUR_MAX_FORMULE)}1`;

    expect(valeurs(evaluerFeuille(feuille({ A1: trop }))).A1).toBe(VALEUR);
  });

  it('refuse une imbrication plus profonde que la borne', () => {
    const profondeur = PROFONDEUR_MAX + 1;
    const trop = `=${'('.repeat(profondeur)}1${')'.repeat(profondeur)}`;

    expect(valeurs(evaluerFeuille(feuille({ A1: trop }))).A1).toBe(VALEUR);
  });

  it('arrête le calcul au budget de nœuds et renvoie #VALEUR!', () => {
    const resultats = evaluerFeuille(feuille({ A1: '=SOMME(A2:A12)' }), {
      budgetNoeuds: 3,
    });

    expect(valeurs(resultats).A1).toBe(VALEUR);
  });

  it('mémoïse chaque cellule : une chaîne de doublements tient dans un budget linéaire', () => {
    const longueur = 40;

    const resultats = evaluerFeuille(chaineDeDoublements(longueur), {
      budgetNoeuds: 6 * longueur,
    });

    expect(valeurs(resultats)[`A${longueur}`]).toBe(2 ** (longueur - 1));
  });

  it('refuse une feuille dont le nombre de cellules dépasse la borne', () => {
    const cellules: Record<string, string> = {};
    for (let rang = 1; rang <= NOMBRE_MAX_CELLULES + 1; rang += 1) {
      cellules[`A${rang}`] = '1';
    }

    expect(() => evaluerFeuille(feuille(cellules))).toThrow(
      FeuilleHorsLimitesError,
    );
  });

  it('refuse une feuille dont la grille n’est pas un couple d’entiers positifs', () => {
    expect(() => evaluerFeuille(feuille({ A1: '1' }, 1.5, 1))).toThrow(
      FeuilleHorsLimitesError,
    );
    expect(() => evaluerFeuille(feuille({ A1: '1' }, 1, -1))).toThrow(
      FeuilleHorsLimitesError,
    );
  });
});

describe('evaluerCellule', () => {
  const grille = feuille({ A1: '4', A2: '=A1*2' });

  it('rend le résultat d’une cellule nommée, quelle que soit la casse', () => {
    expect(evaluerCellule(grille, 'a2')).toEqual({ valeur: 8, erreur: null });
  });

  it('rend zéro pour une cellule vide de la grille', () => {
    expect(evaluerCellule(grille, 'B3')).toEqual({ valeur: 0, erreur: null });
  });

  it('rend #REF! pour un nom illisible ou hors grille', () => {
    expect(evaluerCellule(grille, 'zzz')).toEqual({
      valeur: null,
      erreur: REF,
    });
    expect(evaluerCellule(grille, 'A99')).toEqual({
      valeur: null,
      erreur: REF,
    });
  });

  it('refuse une feuille hors limites comme evaluerFeuille', () => {
    expect(() => evaluerCellule(feuille({ A1: '1' }, -1, 1), 'A1')).toThrow(
      FeuilleHorsLimitesError,
    );
  });
});

describe('evaluerExpression', () => {
  it('résout les variables et arrondit le résultat au millionième', () => {
    expect(
      evaluerExpression('prix / avantPrix', { prix: 20.52, avantPrix: 21.6 }),
    ).toEqual({ valeur: 0.95, erreur: null });
    expect(evaluerExpression('1/3', {})).toEqual({
      valeur: 0.333333,
      erreur: null,
    });
  });

  it('accepte le signe égal de tête', () => {
    expect(evaluerExpression('=2+3', {})).toEqual({ valeur: 5, erreur: null });
  });

  it('élève à la puissance en associant à gauche', () => {
    expect(evaluerExpression('2^3^2', {})).toEqual({
      valeur: 64,
      erreur: null,
    });
    expect(evaluerExpression('PUISSANCE(2;10)', {})).toEqual({
      valeur: 1024,
      erreur: null,
    });
  });

  it('arrondit la moitié en s’éloignant de zéro', () => {
    const arrondis = ['ARRONDI(-2,5;0)', 'ARRONDI(2,5;0)', 'ARRONDI(1,005;2)'];

    expect(
      arrondis.map((expression) => evaluerExpression(expression, {}).valeur),
    ).toEqual([-3, 3, 1.01]);
  });

  it('accepte SI à deux ou à trois arguments', () => {
    expect(evaluerExpression('SI(1>2;10)', {}).valeur).toBe(0);
    expect(evaluerExpression('SI(1<2;10;20)', {}).valeur).toBe(10);
  });

  it('compare et rend 1 ou 0', () => {
    expect(evaluerExpression('SI(3<>4;1;0)', {}).valeur).toBe(1);
    expect(evaluerExpression('SI(4>=4;1;0)', {}).valeur).toBe(1);
  });

  it('refuse une variable inconnue par #NOM?', () => {
    expect(evaluerExpression('inconnue + 1', {})).toEqual({
      valeur: null,
      erreur: NOM,
    });
  });

  it('refuse une division par zéro et une référence de cellule sans feuille', () => {
    expect(evaluerExpression('1/0', {}).erreur).toBe(DIV);
    expect(evaluerExpression('A1+1', {}).erreur).toBe(REF);
  });

  it('refuse une expression illisible et un résultat non fini', () => {
    expect(evaluerExpression('2+', {}).erreur).toBe(VALEUR);
    expect(evaluerExpression('2^1024', {}).erreur).toBe(VALEUR);
  });

  it('s’arrête au budget de nœuds', () => {
    expect(evaluerExpression('1+1+1+1+1', {}, { budgetNoeuds: 2 }).erreur).toBe(
      VALEUR,
    );
  });
});

describe('surfaceDeFormule', () => {
  it('relève les références sans le dollar et les littéraux décimaux', () => {
    expect(surfaceDeFormule('=SOMME($C$2:C4)/100+0,5')).toEqual({
      references: ['C2', 'C4'],
      litteraux: [100, 0.5],
    });
  });

  it('rend null pour une valeur tapée et pour une formule illisible', () => {
    expect(surfaceDeFormule('0,345217')).toBeNull();
    expect(surfaceDeFormule('=C2/')).toBeNull();
  });
});

describe('formeR1C1', () => {
  it('rend les décalages relatifs d’une formule recopiable', () => {
    expect(formeR1C1('=(C2-B2)/B2', 'D2')).toBe('=(RC[-1]-RC[-2])/RC[-2]');
    expect(formeR1C1('=C2*F2', 'G2')).toBe('=RC[-4]*RC[-1]');
  });

  it('rend la même forme pour une référence figée recopiée', () => {
    expect(formeR1C1('=C2/$C$5', 'E2')).toBe('=RC[-2]/R5C3');
    expect(formeR1C1('=C3/$C$5', 'E3')).toBe('=RC[-2]/R5C3');
  });

  it('omet le crochet quand le décalage est nul et garde les mixtes', () => {
    expect(formeR1C1('=A2', 'A3')).toBe('=R[-1]C');
    expect(formeR1C1('=$A2', 'B2')).toBe('=RC1');
    expect(formeR1C1('=A$2', 'B3')).toBe('=R2C[-1]');
  });

  it('conserve les noms de fonctions et les séparateurs', () => {
    expect(formeR1C1('=SI(ARRONDI(SOMME(E2:E4);6)=1;1;0)', 'B7')).toBe(
      '=SI(ARRONDI(SOMME(R[-5]C[3]:R[-3]C[3]);6)=1;1;0)',
    );
  });

  it('rend null hors formule, hors cellule et hors syntaxe', () => {
    expect(formeR1C1('0,35', 'E2')).toBeNull();
    expect(formeR1C1('=C2', 'plop')).toBeNull();
    expect(formeR1C1('=C2/', 'E2')).toBeNull();
  });
});
