import { estEntierDansLesBornes } from './dans-les-bornes';

export function estEntierPositif(valeur: number): boolean {
  return estEntierDansLesBornes(valeur, {
    min: 0,
    max: Number.POSITIVE_INFINITY,
  });
}
