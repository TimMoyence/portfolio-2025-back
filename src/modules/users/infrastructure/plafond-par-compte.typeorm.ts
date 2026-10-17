import type { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { poseeDepuisMoinsDe } from '../../../common/infrastructure/typeorm/horloge-de-la-base';
import { enTransactionSurLaCle } from '../../../common/infrastructure/typeorm/verrou-de-transaction';
import { plafondAtteint, type PlafondDEnvois } from '../domain/PlafondDEnvois';

type EnvoiDUnCompte = ObjectLiteral & { userId: string; createdAt: Date };

export function sousLePlafondDuCompte<E extends EnvoiDUnCompte, T>(
  repo: Repository<E>,
  userId: string,
  plafond: PlafondDEnvois,
  enregistrer: (depot: Repository<E>) => Promise<T>,
): Promise<T | null> {
  return enTransactionSurLaCle(repo, userId, async (depot) => {
    const recents = await depot.countBy({
      userId,
      createdAt: poseeDepuisMoinsDe(plafond.fenetreMs),
    } as FindOptionsWhere<E>);
    return plafondAtteint(plafond, recents) ? null : enregistrer(depot);
  });
}
