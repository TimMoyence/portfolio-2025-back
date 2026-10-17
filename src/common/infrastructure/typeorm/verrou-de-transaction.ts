import type { EntityManager } from 'typeorm';

export async function verrouillerJusquALaFinDeLaTransaction(
  manager: EntityManager,
  cle: string,
): Promise<void> {
  await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [cle]);
}
