export interface Bornes {
  readonly min: number;
  readonly max: number;
}

export function dansLesBornes(valeur: number, { min, max }: Bornes): boolean {
  return valeur >= min && valeur <= max;
}
