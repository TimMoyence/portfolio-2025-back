/**
 * Configuration de la queue BullMQ d'evaluation des badges Sebastian.
 *
 * La queue est optionnelle : si Redis est indisponible ou si la queue
 * est desactivee via env, la queue bascule en mode in-process avec
 * fire-and-forget (setImmediate). Les jobs sont deduplique par userId
 * pour eviter la race condition sur la contrainte unique
 * `(user_id, badge_key)`.
 */
export interface SebastianBadgesAutomationConfig {
  queueEnabled: boolean;
  queueName: string;
  queueConcurrency: number;
  queueAttempts: number;
  queueBackoffMs: number;
  jobTimeoutMs: number;
  /** TTL de deduplication : un meme userId ne peut etre enqueue qu'une fois dans cette fenetre. */
  dedupeWindowMs: number;
  redisUrl?: string;
  redisHost?: string;
  redisPort?: number;
  redisUsername?: string;
  redisPassword?: string;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = (process.env[name] ?? '').toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

function envString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

/** Charge la configuration depuis l'environnement avec des valeurs par defaut. */
export function loadSebastianBadgesAutomationConfig(): SebastianBadgesAutomationConfig {
  return {
    queueEnabled: envBool('SEBASTIAN_BADGES_QUEUE_ENABLED', true),
    queueName:
      envString('SEBASTIAN_BADGES_QUEUE_NAME') ?? 'sebastian_badges_evaluation',
    queueConcurrency: Math.max(
      1,
      envInt('SEBASTIAN_BADGES_QUEUE_CONCURRENCY', 1),
    ),
    queueAttempts: Math.max(1, envInt('SEBASTIAN_BADGES_QUEUE_ATTEMPTS', 3)),
    queueBackoffMs: Math.max(
      0,
      envInt('SEBASTIAN_BADGES_QUEUE_BACKOFF_MS', 500),
    ),
    jobTimeoutMs: Math.max(
      1000,
      envInt('SEBASTIAN_BADGES_JOB_TIMEOUT_MS', 30_000),
    ),
    dedupeWindowMs: Math.max(
      0,
      envInt('SEBASTIAN_BADGES_DEDUPE_WINDOW_MS', 5_000),
    ),
    redisUrl: envString('REDIS_URL'),
    redisHost: envString('REDIS_HOST'),
    redisPort: envString('REDIS_PORT')
      ? Math.max(1, envInt('REDIS_PORT', 6379))
      : undefined,
    redisUsername: envString('REDIS_USERNAME'),
    redisPassword: envString('REDIS_PASSWORD'),
  };
}
