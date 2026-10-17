import {
  MoreThan,
  type DeepPartial,
  type FindOptionsWhere,
  type ObjectLiteral,
  type Repository,
} from 'typeorm';
import type { PlafondDEnvois } from '../domain/PlafondDEnvois';
import { sousLePlafondDuCompte } from './plafond-par-compte.typeorm';

type EntiteDeJeton = ObjectLiteral & { expiresAt: Date };

interface ChampsDuJeton {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export function nonExpire<E extends EntiteDeJeton>(
  critere: FindOptionsWhere<E>,
): FindOptionsWhere<E> {
  return { ...critere, expiresAt: MoreThan(new Date()) };
}

export function champsDuJeton(jeton: ChampsDuJeton): ChampsDuJeton {
  return {
    userId: jeton.userId,
    tokenHash: jeton.tokenHash,
    expiresAt: jeton.expiresAt,
  };
}

export function remplacerSousVerrou<
  E extends EntiteDeJeton & { userId: string; createdAt: Date },
>(
  repo: Repository<E>,
  nouveau: DeepPartial<E> & ChampsDuJeton,
  plafond: PlafondDEnvois,
  invaliderLesActifs: (depot: Repository<E>) => Promise<unknown>,
): Promise<E | null> {
  return sousLePlafondDuCompte(repo, nouveau.userId, plafond, async (depot) => {
    await invaliderLesActifs(depot);
    return depot.save(depot.create(nouveau));
  });
}
