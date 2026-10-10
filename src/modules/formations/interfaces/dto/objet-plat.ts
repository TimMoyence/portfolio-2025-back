import { estObjet } from '../../../../common/domain/est-objet';

export function entreesBornees(
  valeur: unknown,
  entreesMax: number,
): [string, unknown][] | null {
  if (!estObjet(valeur)) {
    return null;
  }
  const entrees = Object.entries(valeur);
  return entrees.length <= entreesMax ? entrees : null;
}
