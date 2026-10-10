import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import {
  journalDErreursRedis,
  optionsRedis,
} from '../../../../common/infrastructure/redis/connexion-redis';
import type { IAuditQueuePort } from '../../domain/IAuditQueue.port';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import { AuditPipelineService } from './audit-pipeline.service';
import { runAuditPipelineWithTimeout } from './audit-pipeline-timeout.util';

export interface AuditQueueJob {
  auditId: string;
}

@Injectable()
export class AuditQueueService implements OnModuleDestroy, IAuditQueuePort {
  private readonly logger = new Logger(AuditQueueService.name);
  private readonly queue?: Queue<AuditQueueJob>;
  private queueDisabledAtRuntime = false;
  private readonly redisConnection?: RedisOptions;

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly pipeline: AuditPipelineService,
  ) {
    if (!this.config.redis || !this.config.queueEnabled) {
      this.logger.warn('Audit queue disabled; using in-process fallback.');
      return;
    }

    const connection = optionsRedis(this.config.redis, {
      maxRetriesPerRequest: null,
    });
    this.redisConnection = connection;
    this.queue = new Queue<AuditQueueJob>(this.config.queueName, {
      connection,
    });
    this.queue.on(
      'error',
      journalDErreursRedis({
        libelle: 'Audit queue Redis error',
        avertir: (message) => this.logger.warn(message),
        auPlafond: () => {
          this.logger.warn(
            'Redis unreachable — audit queue disabled, falling back to in-process execution.',
          );
          this.queueDisabledAtRuntime = true;
        },
      }),
    );
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
      jobId: auditId,
      attempts: this.config.queueAttempts,
      backoff: { type: 'fixed', delay: this.config.queueBackoffMs },
      removeOnComplete: true,
      removeOnFail: 100,
    };

    try {
      // P1.5 idempotence : `jobId: auditId` fait refuser silencieusement
      // les duplicates par BullMQ (pas de double enqueue, pas de double
      // cout LLM si le client resoumet ou si l'API retente).
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

  runWithTimeout(auditId: string): Promise<void> {
    return runAuditPipelineWithTimeout(
      this.pipeline,
      auditId,
      this.config.jobTimeoutMs,
    );
  }
}
