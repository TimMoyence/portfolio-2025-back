export function estEntierPositif(valeur: number): boolean {
  return Number.isSafeInteger(valeur) && valeur >= 0;
}
