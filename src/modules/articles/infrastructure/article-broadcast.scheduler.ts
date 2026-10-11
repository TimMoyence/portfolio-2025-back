import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { messageDErreur } from '../../../common/domain/errors/message-d-erreur';
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
        `Article broadcast run failed: ${messageDErreur(error)}`,
      );
    } finally {
      this.running = false;
    }
  }
}
