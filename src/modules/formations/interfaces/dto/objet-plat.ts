export function entreesBornees(
  valeur: unknown,
  entreesMax: number,
): [string, unknown][] | null {
  if (typeof valeur !== 'object' || valeur === null || Array.isArray(valeur)) {
    return null;
  }
  const entrees = Object.entries(valeur);
  return entrees.length <= entreesMax ? entrees : null;
}
