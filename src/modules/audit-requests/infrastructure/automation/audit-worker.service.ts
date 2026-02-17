import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import { AuditPipelineService } from './audit-pipeline.service';
import { AuditQueueJob, AuditQueueService } from './audit-queue.service';

@Injectable()
export class AuditWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditWorkerService.name);
  private worker?: Worker<AuditQueueJob>;

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly queueService: AuditQueueService,
    private readonly pipeline: AuditPipelineService,
  ) {}

  onModuleInit(): void {
    if (!this.queueService.isQueueEnabled || !this.queueService.connection) {
      return;
    }

    this.worker = new Worker<AuditQueueJob>(
      this.queueService.queueName,
      async (job) => {
        await this.pipeline.run(job.data.auditId);
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

    this.worker.on('error', (error) => {
      this.logger.warn(`Audit worker error: ${String(error)}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
