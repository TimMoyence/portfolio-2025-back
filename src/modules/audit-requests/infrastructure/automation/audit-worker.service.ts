import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { journalDErreursRedis } from '../../../../common/infrastructure/redis/connexion-redis';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import { AuditQueueJob, AuditQueueService } from './audit-queue.service';

@Injectable()
export class AuditWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditWorkerService.name);
  private worker?: Worker<AuditQueueJob>;

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly queueService: AuditQueueService,
  ) {}

  onModuleInit(): void {
    if (!this.queueService.isQueueEnabled || !this.queueService.connection) {
      return;
    }

    this.worker = new Worker<AuditQueueJob>(
      this.queueService.queueName,
      async (job) => {
        await this.queueService.runWithTimeout(job.data.auditId);
      },
      {
        connection: this.queueService.connection,
        concurrency: this.config.queueConcurrency,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `Audit job failed (jobId=${job?.id}, auditId=${job?.data.auditId}): ${String(error)}`,
      );
    });

    this.worker.on(
      'error',
      journalDErreursRedis({
        libelle: 'Audit worker error',
        avertir: (message) => this.logger.warn(message),
        auPlafond: () =>
          this.logger.warn(
            'Redis unreachable — audit worker disabled, falling back to in-process execution.',
          ),
      }),
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
