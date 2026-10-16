import {
  MoreThan,
  type DeepPartial,
  type FindOptionsWhere,
  type ObjectLiteral,
  type Repository,
} from 'typeorm';
import { verrouillerJusquALaFinDeLaTransaction } from '../../../common/infrastructure/typeorm/verrou-de-transaction';

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
  return repo.manager.transaction(async (manager) => {
    await verrouillerJusquALaFinDeLaTransaction(
      manager,
      `${repo.metadata.tableName}:${nouveau.userId}`,
    );
    const depot = manager.withRepository(repo);
    await invaliderLesActifs(depot);
    return depot.save(depot.create(nouveau));
  });
}
