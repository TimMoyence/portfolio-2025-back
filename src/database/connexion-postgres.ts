import {
  envPremier,
  envUnVrai,
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

const ALIAS_POSTGRES = {
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
} as const;

function nomDeBaseDeLUrl(url: string): string | undefined {
  if (!URL.canParse(url)) return undefined;
  return new URL(url).pathname.replace(/^\//, '') || undefined;
}

const PORT_ENTIER = /^\d+$/;

function portDe(source: SourceDEnv): number | undefined {
  const brut = envPremier(ALIAS_POSTGRES.port, source);
  if (brut === undefined) return undefined;
  if (!PORT_ENTIER.test(brut)) {
    throw new Error(
      `Le port PostgreSQL « ${brut} » n'est pas un entier positif (${ALIAS_POSTGRES.port.join(', ')}).`,
    );
  }
  return Number(brut);
}

function sslDe(source: SourceDEnv): SslPostgres | undefined {
  if (!envUnVrai(ALIAS_POSTGRES.ssl, source)) return undefined;
  return { rejectUnauthorized: source.NODE_ENV === 'production' };
}

function sansIndefinis<T extends object>(objet: T): T {
  return Object.fromEntries(
    Object.entries(objet).filter(([, valeur]) => valeur !== undefined),
  ) as T;
}

export function resoudreConnexionPostgres(
  source: SourceDEnv = process.env,
): ConnexionPostgres {
  const url = envPremier(['DATABASE_URL'], source);
  return sansIndefinis({
    url,
    host: envPremier(ALIAS_POSTGRES.host, source),
    port: portDe(source),
    username: envPremier(ALIAS_POSTGRES.username, source),
    password: envPremier(ALIAS_POSTGRES.password, source),
    database:
      envPremier(ALIAS_POSTGRES.database, source) ??
      (url === undefined ? undefined : nomDeBaseDeLUrl(url)),
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
