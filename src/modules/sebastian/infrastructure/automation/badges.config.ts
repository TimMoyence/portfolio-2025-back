import {
  envBool,
  envInt,
  envString,
} from '../../../../config/env-readers.util';

export interface SebastianBadgesAutomationConfig {
  queueEnabled: boolean;
  queueName: string;
  queueConcurrency: number;
  queueAttempts: number;
  queueBackoffMs: number;
  jobTimeoutMs: number;
  dedupeWindowMs: number;
  redisUrl?: string;
  redisHost?: string;
  redisPort?: number;
  redisUsername?: string;
  redisPassword?: string;
}

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
