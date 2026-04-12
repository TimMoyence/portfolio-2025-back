import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import type { IBadgesEvaluationQueuePort } from '../../domain/IBadgesEvaluationQueue.port';
import { SEBASTIAN_BADGES_AUTOMATION_CONFIG } from '../../domain/token';
import type { SebastianBadgesAutomationConfig } from './badges.config';
import { EvaluateBadgesUseCase } from '../../application/services/EvaluateBadges.useCase';

export interface BadgesEvaluationJob {
  userId: string;
}

export interface BadgesRedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: Record<string, never>;
  maxRetriesPerRequest?: number | null;
  retryStrategy?: (times: number) => number | null;
}

/**
 * Queue BullMQ pour l'evaluation asynchrone des badges Sebastian.
 *
 * - Deduplique les jobs par userId sur une fenetre configurable, ce qui
 *   previent la race condition sur la contrainte unique
 *   `(user_id, badge_key)` quand plusieurs entrees sont creees en rafale.
 * - Fallback gracieux en mode in-process si Redis est indisponible ou si
 *   la queue est desactivee via env.
 */
@Injectable()
export class BadgesEvaluationQueueService
  implements OnModuleDestroy, IBadgesEvaluationQueuePort
{
  private readonly logger = new Logger(BadgesEvaluationQueueService.name);
  private readonly queue?: Queue<BadgesEvaluationJob>;
  private readonly redisConnection?: BadgesRedisConnectionOptions;
  private redisErrors = 0;
  private queueDisabledAtRuntime = false;
  private static readonly MAX_REDIS_ERRORS = 3;

  constructor(
    @Inject(SEBASTIAN_BADGES_AUTOMATION_CONFIG)
    private readonly config: SebastianBadgesAutomationConfig,
    private readonly evaluateBadges: EvaluateBadgesUseCase,
  ) {
    const connection = this.buildConnection();
    if (!connection || !this.config.queueEnabled) {
      this.logger.warn(
        'Sebastian badges queue disabled; using in-process fallback.',
      );
      return;
    }

    this.redisConnection = connection;
    this.queue = new Queue<BadgesEvaluationJob>(this.config.queueName, {
      connection,
    });
    this.queue.on('error', (error) => {
      this.redisErrors++;
      if (this.redisErrors <= BadgesEvaluationQueueService.MAX_REDIS_ERRORS) {
        this.logger.warn(`Badges queue Redis error: ${String(error)}`);
      }
      if (this.redisErrors === BadgesEvaluationQueueService.MAX_REDIS_ERRORS) {
        this.logger.warn(
          'Redis unreachable — sebastian badges queue disabled, falling back to in-process execution.',
        );
        this.queueDisabledAtRuntime = true;
      }
    });
  }

  get queueName(): string {
    return this.config.queueName;
  }

  get connection(): BadgesRedisConnectionOptions | undefined {
    return this.redisConnection;
  }

  get isQueueEnabled(): boolean {
    return Boolean(
      this.queue && this.config.queueEnabled && !this.queueDisabledAtRuntime,
    );
  }

  /**
   * Met en file un job d'evaluation pour l'utilisateur.
   *
   * Le jobId fixe a `badges:{userId}` plus `removeOnComplete` garantit qu'un
   * meme userId ne peut avoir qu'un seul job en vol dans la fenetre de
   * deduplication. Toute seconde demande sur le meme userId avant la fin
   * du traitement est absorbee silencieusement par BullMQ.
   */
  async enqueue(userId: string): Promise<void> {
    if (!this.queue || this.queueDisabledAtRuntime) {
      this.runInline(userId);
      return;
    }

    const options: JobsOptions = {
      jobId: `badges:${userId}`,
      attempts: this.config.queueAttempts,
      backoff: { type: 'fixed', delay: this.config.queueBackoffMs },
      removeOnComplete: true,
      removeOnFail: 50,
    };

    try {
      await this.queue.add('badges.evaluate', { userId }, options);
    } catch (error) {
      this.logger.warn(
        `Badges enqueue failed for ${userId}, switching to inline: ${String(error)}`,
      );
      this.runInline(userId);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }

  private runInline(userId: string): void {
    setImmediate(() => {
      void this.runWithTimeout(userId).catch((error) => {
        this.logger.warn(
          `Inline badges evaluation failed for ${userId}: ${String(error)}`,
        );
      });
    });
  }

  private async runWithTimeout(userId: string): Promise<void> {
    const timeout = this.config.jobTimeoutMs;
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Badges evaluation timeout after ${timeout}ms (userId=${userId})`,
          ),
        );
      }, timeout);
    });

    try {
      await Promise.race([this.evaluateBadges.execute(userId), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private buildConnection(): BadgesRedisConnectionOptions | undefined {
    const ioredisDefaults: Pick<
      BadgesRedisConnectionOptions,
      'maxRetriesPerRequest' | 'retryStrategy'
    > = {
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => {
        if (times > BadgesEvaluationQueueService.MAX_REDIS_ERRORS) return null;
        return Math.min(times * 500, 3000);
      },
    };

    if (this.config.redisUrl) {
      const url = new URL(this.config.redisUrl);
      const username = decodeURIComponent(url.username || '');
      const password = decodeURIComponent(url.password || '');
      return {
        ...ioredisDefaults,
        host: url.hostname,
        port: Number.parseInt(url.port || '6379', 10),
        ...(username ? { username } : {}),
        ...(password ? { password } : {}),
        ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
      };
    }

    if (this.config.redisHost && this.config.redisPort) {
      return {
        ...ioredisDefaults,
        host: this.config.redisHost,
        port: this.config.redisPort,
        username: this.config.redisUsername,
        password: this.config.redisPassword,
      };
    }

    return undefined;
  }
}
