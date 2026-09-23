import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ARTICLE_BROADCAST_MAILER,
  ARTICLE_BROADCAST_REPOSITORY,
  type ArticleBroadcastMailer,
  type ArticleBroadcastRecord,
  type ArticleBroadcastRepository,
  type BroadcastRecipient,
} from './article-broadcast.repository';
import {
  ARTICLE_NEWSLETTER_SOURCE,
  broadcastBatchSize,
  broadcastEnabled,
} from './article-settings';
import {
  ARTICLES_REPOSITORY,
  type ArticleRecord,
  type ArticlesRepository,
} from './articles.repository';

const LEASE_MS = 10 * 60_000;
const MAX_LATENESS_MS = 24 * 3_600_000;
const MAX_ERROR_LENGTH = 200;

export type BroadcastRunResult =
  | { status: 'disabled' }
  | { status: 'idle' }
  | {
      status: 'sent' | 'partial' | 'cancelled' | 'expired';
      broadcastId: string;
      sent: number;
      failed: number;
    };

const ADDRESS_DELIMITERS = new Set([
  ' ',
  '\t',
  '\n',
  '\r',
  '<',
  '>',
  '(',
  ')',
  '"',
  "'",
  ',',
  ';',
  ':',
]);

function redactToken(token: string): string {
  const at = token.indexOf('@');
  return at > 0 && at < token.length - 1 ? '[redacted]' : token;
}

function redactedError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  let redacted = '';
  let token = '';
  for (const char of message) {
    if (ADDRESS_DELIMITERS.has(char)) {
      redacted += redactToken(token) + char;
      token = '';
    } else {
      token += char;
    }
  }
  return (redacted + redactToken(token)).slice(0, MAX_ERROR_LENGTH);
}

@Injectable()
export class ArticleBroadcastService {
  private readonly logger = new Logger(ArticleBroadcastService.name);

  constructor(
    @Inject(ARTICLE_BROADCAST_REPOSITORY)
    private readonly broadcasts: ArticleBroadcastRepository,
    @Inject(ARTICLES_REPOSITORY)
    private readonly articles: ArticlesRepository,
    @Inject(ARTICLE_BROADCAST_MAILER)
    private readonly mailer: ArticleBroadcastMailer,
  ) {}

  async runDue(now: Date = new Date()): Promise<BroadcastRunResult> {
    if (!broadcastEnabled() || !this.mailer.isEnabled()) {
      return { status: 'disabled' };
    }
    const broadcast = await this.broadcasts.claimDue(
      now,
      new Date(now.getTime() + LEASE_MS),
    );
    if (!broadcast) return { status: 'idle' };

    const article = await this.articles.findArticleByRecordId(
      broadcast.articleRecordId,
    );
    if (!article || article.status !== 'published') {
      return this.close(broadcast, 'cancelled', now);
    }
    if (this.isStale(broadcast, now)) {
      return this.close(broadcast, 'expired', now);
    }
    return this.sendBatch(broadcast, article, now);
  }

  private isStale(broadcast: ArticleBroadcastRecord, now: Date): boolean {
    const untouched = broadcast.sentCount === 0 && broadcast.failedCount === 0;
    return (
      untouched &&
      now.getTime() - broadcast.sendAfter.getTime() > MAX_LATENESS_MS
    );
  }

  private async sendBatch(
    broadcast: ArticleBroadcastRecord,
    article: ArticleRecord,
    now: Date,
  ): Promise<BroadcastRunResult> {
    const batchSize = broadcastBatchSize();
    const recipients = await this.broadcasts.findPendingRecipients(
      broadcast.id,
      ARTICLE_NEWSLETTER_SOURCE,
      article.locale,
      batchSize,
    );
    let sent = 0;
    let failed = 0;
    for (const recipient of recipients) {
      const outcome = await this.deliver(broadcast.id, article, recipient);
      if (outcome === 'sent') sent += 1;
      if (outcome === 'failed') failed += 1;
    }

    const complete = recipients.length < batchSize;
    await this.broadcasts.updateBroadcast(broadcast.id, {
      status: complete ? 'sent' : 'sending',
      lockedUntil: complete ? null : now,
      sentCount: broadcast.sentCount + sent,
      failedCount: broadcast.failedCount + failed,
      completedAt: complete ? now : null,
    });
    const progress = complete ? 'complete' : 'continuing';
    this.logger.log(
      `Article broadcast ${broadcast.id}: ${sent} sent, ${failed} failed, ${progress}`,
    );
    return {
      status: complete ? 'sent' : 'partial',
      broadcastId: broadcast.id,
      sent,
      failed,
    };
  }

  private async deliver(
    broadcastId: string,
    article: ArticleRecord,
    recipient: BroadcastRecipient,
  ): Promise<'sent' | 'failed' | 'skipped'> {
    const reserved = await this.broadcasts.reserveRecipient(
      broadcastId,
      recipient.subscriberId,
    );
    if (!reserved) return 'skipped';
    try {
      await this.mailer.send(article, recipient);
    } catch (error) {
      await this.broadcasts.markRecipient(
        broadcastId,
        recipient.subscriberId,
        'failed',
        redactedError(error),
      );
      return 'failed';
    }
    await this.broadcasts.markRecipient(
      broadcastId,
      recipient.subscriberId,
      'sent',
      null,
    );
    return 'sent';
  }

  private async close(
    broadcast: ArticleBroadcastRecord,
    status: 'cancelled' | 'expired',
    now: Date,
  ): Promise<BroadcastRunResult> {
    await this.broadcasts.updateBroadcast(broadcast.id, {
      status,
      lockedUntil: null,
      completedAt: now,
    });
    this.logger.warn(`Article broadcast ${broadcast.id} ${status}`);
    return { status, broadcastId: broadcast.id, sent: 0, failed: 0 };
  }
}
