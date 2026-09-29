import {
  type Feuille,
  NOMBRE_MAX_CELLULES,
} from '../../src/modules/formations/domain/cours/Formule';

export function colonneDeSommesCirculaires(): Feuille {
  const cellules: Record<string, string> = {};
  for (let rang = 1; rang <= NOMBRE_MAX_CELLULES; rang += 1) {
    cellules[`A${rang}`] = `=SOMME(A1:A${NOMBRE_MAX_CELLULES})`;
  }
  return { lignes: NOMBRE_MAX_CELLULES, colonnes: 1, cellules };
}

export function chaineDeDoublements(longueur: number): Feuille {
  const cellules: Record<string, string> = { A1: '1' };
  for (let rang = 2; rang <= longueur; rang += 1) {
    cellules[`A${rang}`] = `=A${rang - 1}+A${rang - 1}`;
  }
  return { lignes: longueur, colonnes: 1, cellules };
}
