import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { envInt, envUnVrai, type SourceDEnv } from '../config/env-readers.util';
import {
  emplacementTypeOrm,
  resoudreConnexionPostgres,
} from './connexion-postgres';
import { garantirLaBaseCible } from './ensure-database';

function synchroniserLeSchema(source: SourceDEnv): boolean {
  return (
    source.NODE_ENV !== 'production' &&
    envUnVrai(['TYPEORM_SYNCHRONIZE', 'DB_SYNCHRONIZE'], source)
  );
}

function optionsDuPool(source: SourceDEnv): Record<string, number> {
  // Pool PG dimensionne pour l'usage concurrent API + BullMQ workers
  // (audit worker hammer la DB pendant pipeline 180s). Defaut node-postgres
  // 10 saturait facilement. Configurable via DB_POOL_MAX.
  return {
    max: envInt('DB_POOL_MAX', 30, source),
    idleTimeoutMillis: envInt('DB_POOL_IDLE_TIMEOUT_MS', 30_000, source),
    connectionTimeoutMillis: envInt(
      'DB_POOL_CONNECT_TIMEOUT_MS',
      5_000,
      source,
    ),
  };
}

export async function optionsTypeOrmDeLApi(
  entites: string,
  source: SourceDEnv = process.env,
): Promise<TypeOrmModuleOptions> {
  const connexion = resoudreConnexionPostgres(source);
  await garantirLaBaseCible(connexion);
  return {
    type: 'postgres',
    entities: [entites],
    synchronize: synchroniserLeSchema(source),
    extra: optionsDuPool(source),
    ...emplacementTypeOrm(connexion),
  };
}
