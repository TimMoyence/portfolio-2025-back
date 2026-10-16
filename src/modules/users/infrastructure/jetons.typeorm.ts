import {
  MoreThan,
  type DeepPartial,
  type FindOptionsWhere,
  type ObjectLiteral,
  type Repository,
} from 'typeorm';
import { enTransactionSurLaCle } from '../../../common/infrastructure/typeorm/verrou-de-transaction';

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

export function remplacerSousVerrou<E extends EntiteDeJeton>(
  repo: Repository<E>,
  nouveau: DeepPartial<E> & ChampsDuJeton,
  invaliderLesActifs: (depot: Repository<E>) => Promise<unknown>,
): Promise<E> {
  return enTransactionSurLaCle(repo, nouveau.userId, async (depot) => {
    await invaliderLesActifs(depot);
    return depot.save(depot.create(nouveau));
  });
}
