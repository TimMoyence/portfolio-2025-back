import type { EntityManager, ObjectLiteral, Repository } from 'typeorm';

export async function verrouillerJusquALaFinDeLaTransaction(
  manager: EntityManager,
  cle: string,
): Promise<void> {
  await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [cle]);
}

export function enTransactionSousVerrou<T>(
  manager: EntityManager,
  cle: string,
  travail: (transaction: EntityManager) => Promise<T>,
): Promise<T> {
  return manager.transaction(async (transaction) => {
    await verrouillerJusquALaFinDeLaTransaction(transaction, cle);
    return travail(transaction);
  });
}

export function enTransactionSurLaCle<E extends ObjectLiteral, T>(
  repo: Repository<E>,
  cle: string,
  travail: (depot: Repository<E>) => Promise<T>,
): Promise<T> {
  return enTransactionSousVerrou(
    repo.manager,
    `${repo.metadata.tableName}:${cle}`,
    (transaction) => travail(transaction.withRepository(repo)),
  );
}
