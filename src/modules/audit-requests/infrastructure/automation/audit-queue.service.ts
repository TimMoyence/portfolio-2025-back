import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import type { IAuditQueuePort } from '../../domain/IAuditQueue.port';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import { AuditPipelineService } from './audit-pipeline.service';

export interface AuditQueueJob {
  auditId: string;
}

export interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: Record<string, never>;
  maxRetriesPerRequest?: number | null;
  retryStrategy?: (times: number) => number | null;
}

@Injectable()
export class AuditQueueService implements OnModuleDestroy, IAuditQueuePort {
  private readonly logger = new Logger(AuditQueueService.name);
  private readonly queue?: Queue<AuditQueueJob>;
  private redisErrors = 0;
  private queueDisabledAtRuntime = false;
  private static readonly MAX_REDIS_ERRORS = 3;
  private readonly redisConnection?: RedisConnectionOptions;

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly pipeline: AuditPipelineService,
  ) {
    const connection = this.buildConnection();
    if (!connection || !this.config.queueEnabled) {
      this.logger.warn('Audit queue disabled; using in-process fallback.');
      return;
    }

    this.redisConnection = connection;
    this.queue = new Queue<AuditQueueJob>(this.config.queueName, {
      connection,
    });
    this.queue.on('error', (error) => {
      this.redisErrors++;
      if (this.redisErrors <= AuditQueueService.MAX_REDIS_ERRORS) {
        this.logger.warn(`Audit queue Redis error: ${String(error)}`);
      }
      if (this.redisErrors === AuditQueueService.MAX_REDIS_ERRORS) {
        this.logger.warn(
          'Redis unreachable — audit queue disabled, falling back to in-process execution.',
        );
        this.queueDisabledAtRuntime = true;
      }
    });
  }

  get queueName(): string {
    return this.config.queueName;
  }

  get connection() {
    return this.redisConnection;
  }

  get isQueueEnabled(): boolean {
    return Boolean(
      this.queue && this.config.queueEnabled && !this.queueDisabledAtRuntime,
    );
  }

  async enqueue(auditId: string): Promise<void> {
    if (!this.queue || this.queueDisabledAtRuntime) {
      this.runInline(auditId);
      return;
    }

    const options: JobsOptions = {
      attempts: this.config.queueAttempts,
      backoff: { type: 'fixed', delay: this.config.queueBackoffMs },
      removeOnComplete: true,
      removeOnFail: 100,
    };

    try {
      await this.queue.add('audit.process', { auditId }, options);
    } catch (error) {
      this.logger.warn(
        `Queue enqueue failed for ${auditId}, switching to inline: ${String(error)}`,
      );
      this.runInline(auditId);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }

  private runInline(auditId: string): void {
    setImmediate(() => {
      void this.runWithTimeout(auditId).catch((error) => {
        this.logger.warn(
          `Inline audit execution failed for ${auditId}: ${String(error)}`,
        );
      });
    });
  }

  private async runWithTimeout(auditId: string): Promise<void> {
    const timeout = this.config.jobTimeoutMs;
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Audit pipeline timeout after ${timeout}ms (auditId=${auditId})`,
          ),
        );
      }, timeout);
    });

    try {
      await Promise.race([this.pipeline.run(auditId), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private buildConnection(): RedisConnectionOptions | undefined {
    const ioredisDefaults: Pick<
      RedisConnectionOptions,
      'maxRetriesPerRequest' | 'retryStrategy'
    > = {
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => {
        if (times > AuditQueueService.MAX_REDIS_ERRORS) return null;
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
