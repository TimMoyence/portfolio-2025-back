import type { Feuille } from '../../src/modules/formations/domain/cours/Formule';

export function chaineDeDoublements(longueur: number): Feuille {
  const cellules: Record<string, string> = { A1: '1' };
  for (let rang = 2; rang <= longueur; rang += 1) {
    cellules[`A${rang}`] = `=A${rang - 1}+A${rang - 1}`;
  }
  return { lignes: longueur, colonnes: 1, cellules };
}
