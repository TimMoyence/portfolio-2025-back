import { createHash } from 'node:crypto';
import type { Feuille, ResultatFormule } from './Formule';

export type VecteurFormule =
  | {
      readonly id: string;
      readonly type: 'feuille';
      readonly entree: Feuille;
      readonly attendu: Readonly<Record<string, ResultatFormule>>;
    }
  | {
      readonly id: string;
      readonly type: 'expression';
      readonly entree: {
        readonly expression: string;
        readonly variables: Readonly<Record<string, number>>;
      };
      readonly attendu: ResultatFormule;
    }
  | {
      readonly id: string;
      readonly type: 'r1c1';
      readonly entree: { readonly formule: string; readonly cellule: string };
      readonly attendu: string | null;
    };

export interface FichierVecteursFormule {
  readonly version: number;
  readonly sha256: string;
  readonly vecteurs: readonly VecteurFormule[];
}

const NON_SERIALISABLE = 'Valeur non sérialisable dans un vecteur de formule';

function estScalaireJson(valeur: unknown): boolean {
  return (
    valeur === null ||
    typeof valeur === 'string' ||
    typeof valeur === 'boolean' ||
    (typeof valeur === 'number' && Number.isFinite(valeur))
  );
}

function comparerParUnitesDeCode(premiere: string, seconde: string): number {
  if (premiere === seconde) {
    return 0;
  }
  return premiere < seconde ? -1 : 1;
}

export function serialiserCanonique(valeur: unknown): string {
  if (Array.isArray(valeur)) {
    return `[${valeur.map(serialiserCanonique).join(',')}]`;
  }
  if (typeof valeur === 'object' && valeur !== null) {
    const objet = valeur as Readonly<Record<string, unknown>>;
    const membres = Object.keys(objet)
      .sort(comparerParUnitesDeCode)
      .map(
        (cle) => `${JSON.stringify(cle)}:${serialiserCanonique(objet[cle])}`,
      );
    return `{${membres.join(',')}}`;
  }
  if (!estScalaireJson(valeur)) {
    throw new Error(NON_SERIALISABLE);
  }
  return JSON.stringify(valeur);
}

export function empreinteDesVecteurs(
  vecteurs: readonly VecteurFormule[],
): string {
  return createHash('sha256')
    .update(serialiserCanonique(vecteurs), 'utf8')
    .digest('hex');
}
