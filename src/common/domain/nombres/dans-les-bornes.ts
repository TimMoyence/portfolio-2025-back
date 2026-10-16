export interface Bornes {
  readonly min: number;
  readonly max: number;
}

export function dansLesBornes(valeur: number, { min, max }: Bornes): boolean {
  return valeur >= min && valeur <= max;
}

export function estEntierDansLesBornes(
  valeur: unknown,
  bornes: Bornes,
): valeur is number {
  return (
    typeof valeur === 'number' &&
    Number.isSafeInteger(valeur) &&
    dansLesBornes(valeur, bornes)
  );
}

export function estEntierStrictementPositif(valeur: unknown): valeur is number {
  return estEntierDansLesBornes(valeur, {
    min: 1,
    max: Number.POSITIVE_INFINITY,
  });
}
