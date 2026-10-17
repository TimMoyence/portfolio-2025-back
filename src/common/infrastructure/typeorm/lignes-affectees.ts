import type { DeleteResult, UpdateResult } from 'typeorm';

export function lignesAffectees(resultat: UpdateResult | DeleteResult): number {
  if (typeof resultat.affected !== 'number') {
    throw new Error('Le pilote n a pas rendu le nombre de lignes touchees');
  }
  return resultat.affected;
}

export function aAffecte(resultat: UpdateResult | DeleteResult): boolean {
  return lignesAffectees(resultat) > 0;
}
