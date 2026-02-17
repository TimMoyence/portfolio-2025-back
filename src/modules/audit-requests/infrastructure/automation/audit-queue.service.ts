import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import { AuditPipelineService } from './audit-pipeline.service';

export interface AuditQueueJob {
  auditId: string;
}

@Injectable()
export class AuditQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(AuditQueueService.name);
  private readonly queue?: Queue<AuditQueueJob>;
  private readonly redisConnection?: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    tls?: Record<string, never>;
  };

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
  }

  get queueName(): string {
    return this.config.queueName;
  }

  get connection() {
    return this.redisConnection;
  }

  get isQueueEnabled(): boolean {
    return Boolean(this.queue && this.config.queueEnabled);
  }

  async enqueue(auditId: string): Promise<void> {
    if (!this.queue) {
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
      void this.pipeline.run(auditId);
    });
  }

  private buildConnection():
    | {
        host: string;
        port: number;
        username?: string;
        password?: string;
        tls?: Record<string, never>;
      }
    | undefined {
    if (this.config.redisUrl) {
      const url = new URL(this.config.redisUrl);
      const username = decodeURIComponent(url.username || '');
      const password = decodeURIComponent(url.password || '');
      return {
        host: url.hostname,
        port: Number.parseInt(url.port || '6379', 10),
        ...(username ? { username } : {}),
        ...(password ? { password } : {}),
        ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
      };
    }

    if (this.config.redisHost && this.config.redisPort) {
      return {
        host: this.config.redisHost,
        port: this.config.redisPort,
        username: this.config.redisUsername,
        password: this.config.redisPassword,
      };
    }

    return undefined;
  }
}
