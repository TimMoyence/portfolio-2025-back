import type { RedisOptions } from 'ioredis';
import { sansIndefinis } from '../../domain/sans-indefinis';
import {
  envPort,
  envString,
  type SourceDEnv,
} from '../../../config/env-readers.util';

export interface ConnexionRedis {
  readonly host: string;
  readonly port: number;
  readonly username?: string;
  readonly password?: string;
  readonly db?: number;
  readonly tls?: Record<string, never>;
}

const PORT_REDIS_PAR_DEFAUT = 6379;
const ESSAIS_DE_RECONNEXION = 3;
const PAS_DE_RECONNEXION_MS = 500;
const BASE_DU_CHEMIN = /^\/(\d+)$/;

function connexionDeLUrl(brute: string): ConnexionRedis {
  if (!URL.canParse(brute)) {
    throw new Error('REDIS_URL n’est pas une URL Redis lisible.');
  }
  const url = new URL(brute);
  const base = BASE_DU_CHEMIN.exec(url.pathname)?.[1];
  return sansIndefinis({
    host: url.hostname.replace(/^\[(.*)\]$/, '$1'),
    port: url.port === '' ? PORT_REDIS_PAR_DEFAUT : Number(url.port),
    username: decodeURIComponent(url.username) || undefined,
    password: decodeURIComponent(url.password) || undefined,
    db: base === undefined ? undefined : Number(base),
    tls: url.protocol === 'rediss:' ? {} : undefined,
  });
}

export function resoudreConnexionRedis(
  source: SourceDEnv = process.env,
): ConnexionRedis | undefined {
  const url = envString('REDIS_URL', source);
  if (url !== undefined) return connexionDeLUrl(url);
  const host = envString('REDIS_HOST', source);
  if (host === undefined) return undefined;
  return sansIndefinis({
    host,
    port: envPort(['REDIS_PORT'], 'Redis', source) ?? PORT_REDIS_PAR_DEFAUT,
    username: envString('REDIS_USERNAME', source),
    password: envString('REDIS_PASSWORD', source),
  });
}

export function delaiDeReconnexionRedis(tentative: number): number | null {
  return tentative > ESSAIS_DE_RECONNEXION
    ? null
    : tentative * PAS_DE_RECONNEXION_MS;
}

type ReglagesDuClient = Pick<
  RedisOptions,
  'lazyConnect' | 'enableOfflineQueue' | 'maxRetriesPerRequest'
>;

export function optionsRedis(
  connexion: ConnexionRedis,
  reglages: ReglagesDuClient,
): RedisOptions {
  return {
    ...connexion,
    ...reglages,
    retryStrategy: delaiDeReconnexionRedis,
  };
}

interface JournalDErreurs {
  readonly libelle: string;
  readonly avertir: (message: string) => void;
  readonly auPlafond?: () => void;
}

export function journalDErreursRedis({
  libelle,
  avertir,
  auPlafond,
}: JournalDErreurs): (erreur: unknown) => void {
  let erreurs = 0;
  return (erreur) => {
    erreurs += 1;
    if (erreurs <= ESSAIS_DE_RECONNEXION) {
      avertir(`${libelle}: ${String(erreur)}`);
    }
    if (erreurs === ESSAIS_DE_RECONNEXION) {
      auPlafond?.();
    }
  };
}
