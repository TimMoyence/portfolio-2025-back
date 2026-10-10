export function borner(valeur: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valeur));
}
