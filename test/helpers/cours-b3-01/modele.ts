import type { Valeur } from './excel';

export interface Formule {
  readonly formule: string;
  readonly resultat: Exclude<Valeur, null>;
}

export type Cellule = Valeur | Formule;

export type FormatDeColonne =
  | 'texte'
  | 'entier'
  | 'euros'
  | 'pourcentage'
  | 'date'
  | 'mois'
  | 'booleen';

export interface Colonne {
  readonly nom: string;
  readonly format: FormatDeColonne;
}

export type Ligne = Readonly<Record<string, Cellule>>;

export interface Onglet {
  readonly colonnes: readonly Colonne[];
  readonly lignes: readonly Ligne[];
}

export type Classeur = Readonly<Record<string, Onglet>>;

export interface JeuB301 {
  readonly brut: Classeur;
  readonly reprise1: Classeur;
  readonly reprise2: Classeur;
}

export function valeurDe(ligne: Ligne, colonne: string): Valeur {
  if (!Object.hasOwn(ligne, colonne)) {
    throw new RangeError(`Colonne absente : ${colonne}`);
  }
  const cellule = ligne[colonne];
  return cellule !== null && typeof cellule === 'object'
    ? cellule.resultat
    : cellule;
}

export function nombreDe(ligne: Ligne, colonne: string): number {
  const valeur = valeurDe(ligne, colonne);
  if (typeof valeur !== 'number') {
    throw new TypeError(`${colonne} n’est pas un nombre : ${String(valeur)}`);
  }
  return valeur;
}

export function texteDe(ligne: Ligne, colonne: string): string {
  const valeur = valeurDe(ligne, colonne);
  if (typeof valeur !== 'string') {
    throw new TypeError(`${colonne} n’est pas un texte : ${String(valeur)}`);
  }
  return valeur;
}

export function ongletDe(classeur: Classeur, nom: string): Onglet {
  if (!Object.hasOwn(classeur, nom)) {
    throw new RangeError(`Onglet absent : ${nom}`);
  }
  return classeur[nom];
}
