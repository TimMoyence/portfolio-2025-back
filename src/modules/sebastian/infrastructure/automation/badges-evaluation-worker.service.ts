import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { SEBASTIAN_BADGES_AUTOMATION_CONFIG } from '../../domain/token';
import type { SebastianBadgesAutomationConfig } from './badges.config';
import {
  BadgesEvaluationJob,
  BadgesEvaluationQueueService,
} from './badges-evaluation-queue.service';
import { EvaluateBadgesUseCase } from '../../application/services/EvaluateBadges.useCase';
import { evaluateBadgesWithTimeout } from './badges-evaluation-timeout';

@Injectable()
export class BadgesEvaluationWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BadgesEvaluationWorkerService.name);
  private worker?: Worker<BadgesEvaluationJob>;
  private connectionErrors = 0;
  private static readonly MAX_CONNECTION_ERRORS = 3;

  constructor(
    @Inject(SEBASTIAN_BADGES_AUTOMATION_CONFIG)
    private readonly config: SebastianBadgesAutomationConfig,
    private readonly queueService: BadgesEvaluationQueueService,
    private readonly evaluateBadges: EvaluateBadgesUseCase,
  ) {}

  onModuleInit(): void {
    if (!this.queueService.isQueueEnabled || !this.queueService.connection) {
      return;
    }

    this.worker = new Worker<BadgesEvaluationJob>(
      this.queueService.queueName,
      async (job) => {
        await this.evaluateWithTimeout(job.data.userId);
      },
      {
        connection: this.queueService.connection,
        concurrency: this.config.queueConcurrency,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.warn(
        `Badges job failed (jobId=${job?.id}, userId=${job?.data.userId}): ${String(error)}`,
      );
    });

    this.worker.on('error', (error) => {
      this.connectionErrors++;
      if (
        this.connectionErrors <=
        BadgesEvaluationWorkerService.MAX_CONNECTION_ERRORS
      ) {
        this.logger.warn(`Badges worker error: ${String(error)}`);
      }
      if (
        this.connectionErrors ===
        BadgesEvaluationWorkerService.MAX_CONNECTION_ERRORS
      ) {
        this.logger.warn(
          'Redis unreachable — sebastian badges worker disabled, falling back to in-process execution.',
        );
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async evaluateWithTimeout(userId: string): Promise<void> {
    await evaluateBadgesWithTimeout(
      this.evaluateBadges,
      userId,
      this.config.jobTimeoutMs,
    );
  }
}
