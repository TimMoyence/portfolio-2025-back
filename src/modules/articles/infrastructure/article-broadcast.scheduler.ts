import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ArticleBroadcastService } from '../application/article-broadcast.service';

@Injectable()
export class ArticleBroadcastScheduler {
  private readonly logger = new Logger(ArticleBroadcastScheduler.name);
  private running = false;

  constructor(private readonly broadcasts: ArticleBroadcastService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.broadcasts.runDue();
    } catch (error) {
      this.logger.error(
        `Article broadcast run failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.running = false;
    }
  }
}
