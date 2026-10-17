import { sansIndefinis } from '../common/domain/sans-indefinis';
import {
  envBrut,
  envPort,
  envPremier,
  envUnVrai,
  estEnProduction,
  type SourceDEnv,
} from '../config/env-readers.util';

interface SslPostgres {
  readonly rejectUnauthorized: boolean;
}

export interface EmplacementTypeOrm {
  readonly url?: string;
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
  readonly ssl?: SslPostgres;
}

export interface ConnexionPostgres extends EmplacementTypeOrm {
  readonly baseAdmin: string;
}

export const ALIAS_POSTGRES = {
  host: ['DB_HOST', 'DATABASE_HOST', 'PGHOST'],
  port: ['DB_PORT', 'DATABASE_PORT', 'PGPORT'],
  username: ['DB_USERNAME', 'DB_USER', 'DATABASE_USER', 'POSTGRES_USER'],
  password: [
    'DB_PASSWORD',
    'DB_PASS',
    'DATABASE_PASSWORD',
    'POSTGRES_PASSWORD',
  ],
  database: ['DB_NAME', 'DATABASE_NAME', 'POSTGRES_DB', 'DB_DATABASE'],
  ssl: ['DB_SSL', 'DATABASE_SSL'],
  baseAdmin: ['DB_ADMIN_DATABASE', 'DATABASE_ADMIN_NAME'],
  synchronize: ['DB_SYNCHRONIZE', 'TYPEORM_SYNCHRONIZE'],
} as const;

const SCHEMAS_POSTGRES: ReadonlySet<string> = new Set([
  'postgres:',
  'postgresql:',
]);

export function nomDeBaseDeLUrl(url: string): string | undefined {
  if (!URL.canParse(url)) return undefined;
  const { protocol, pathname } = new URL(url);
  if (!SCHEMAS_POSTGRES.has(protocol)) return undefined;
  try {
    return decodeURI(pathname.slice(1)) || undefined;
  } catch {
    return undefined;
  }
}

function sslDe(source: SourceDEnv): SslPostgres | undefined {
  if (!envUnVrai(ALIAS_POSTGRES.ssl, source)) return undefined;
  return { rejectUnauthorized: estEnProduction(source) };
}

export function resoudreConnexionPostgres(
  source: SourceDEnv = process.env,
): ConnexionPostgres {
  const url = envPremier(['DATABASE_URL'], source);
  return sansIndefinis({
    url,
    host: envPremier(ALIAS_POSTGRES.host, source),
    port: envPort(ALIAS_POSTGRES.port, 'PostgreSQL', source),
    username: envPremier(ALIAS_POSTGRES.username, source, envBrut),
    password: envPremier(ALIAS_POSTGRES.password, source, envBrut),
    database:
      url === undefined
        ? envPremier(ALIAS_POSTGRES.database, source)
        : nomDeBaseDeLUrl(url),
    ssl: sslDe(source),
    baseAdmin: envPremier(ALIAS_POSTGRES.baseAdmin, source) ?? 'postgres',
  });
}

export function emplacementTypeOrm({
  url,
  host,
  port,
  username,
  password,
  database,
  ssl,
}: ConnexionPostgres): EmplacementTypeOrm {
  const acces =
    url === undefined ? { host, port, username, password } : { url };
  return sansIndefinis({ ...acces, database, ssl });
}
