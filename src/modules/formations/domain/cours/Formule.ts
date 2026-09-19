export type CodeErreur = '#REF!' | '#DIV/0!' | '#NOM?' | '#VALEUR!';

export interface ResultatFormule {
  readonly valeur: number | null;
  readonly erreur: CodeErreur | null;
}

export interface Feuille {
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
}
