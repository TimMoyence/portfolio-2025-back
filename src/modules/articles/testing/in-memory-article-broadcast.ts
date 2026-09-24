import type {
  ArticleBroadcastMailer,
  ArticleBroadcastPatch,
  ArticleBroadcastRecord,
  ArticleBroadcastRepository,
  BroadcastRecipient,
  ModeratedArticle,
} from '../application/article-broadcast.repository';
import type {
  ArticleRecord,
  ArticleStatus,
} from '../application/articles.repository';

interface Subscriber extends BroadcastRecipient {
  source: string;
  locale: string;
  status: 'confirmed' | 'pending' | 'unsubscribed';
}

export class InMemoryArticleBroadcasts implements ArticleBroadcastRepository {
  readonly articles = new Map<string, ArticleRecord>();
  readonly broadcasts = new Map<string, ArticleBroadcastRecord>();
  readonly subscribers: Subscriber[] = [];
  readonly recipients = new Map<string, 'sending' | 'sent' | 'failed'>();
  readonly recipientErrors = new Map<string, string | null>();

  claimDue(
    now: Date,
    lockedUntil: Date,
  ): Promise<ArticleBroadcastRecord | null> {
    const due = [...this.broadcasts.values()]
      .filter(
        (broadcast) =>
          (broadcast.status === 'scheduled' && broadcast.sendAfter <= now) ||
          (broadcast.status === 'sending' &&
            (broadcast.lockedUntil === null || broadcast.lockedUntil <= now)),
      )
      .sort((a, b) => a.sendAfter.getTime() - b.sendAfter.getTime())[0];
    if (!due) return Promise.resolve(null);
    due.status = 'sending';
    due.lockedUntil = lockedUntil;
    return Promise.resolve({ ...due });
  }

  findPendingRecipients(
    broadcastId: string,
    source: string,
    locale: 'fr' | 'en',
    limit: number,
  ): Promise<BroadcastRecipient[]> {
    return Promise.resolve(
      this.subscribers
        .filter(
          (subscriber) =>
            subscriber.status === 'confirmed' &&
            subscriber.source === source &&
            (subscriber.locale === locale ||
              subscriber.locale.startsWith(`${locale}-`)) &&
            !this.recipients.has(`${broadcastId}:${subscriber.subscriberId}`),
        )
        .slice(0, limit)
        .map(({ subscriberId, email, firstName, unsubscribeToken }) => ({
          subscriberId,
          email,
          firstName,
          unsubscribeToken,
        })),
    );
  }

  reserveRecipient(
    broadcastId: string,
    subscriberId: string,
  ): Promise<boolean> {
    const key = `${broadcastId}:${subscriberId}`;
    if (this.recipients.has(key)) return Promise.resolve(false);
    this.recipients.set(key, 'sending');
    return Promise.resolve(true);
  }

  markRecipient(
    broadcastId: string,
    subscriberId: string,
    status: 'sent' | 'failed',
    error: string | null,
  ): Promise<void> {
    const key = `${broadcastId}:${subscriberId}`;
    this.recipients.set(key, status);
    this.recipientErrors.set(key, error);
    return Promise.resolve();
  }

  updateBroadcast(id: string, patch: ArticleBroadcastPatch): Promise<void> {
    const broadcast = this.broadcasts.get(id);
    if (broadcast) Object.assign(broadcast, patch);
    return Promise.resolve();
  }

  findModerated(articleId: string): Promise<ModeratedArticle | null> {
    const article = [...this.articles.values()].find(
      (candidate) => candidate.articleId === articleId,
    );
    if (!article) return Promise.resolve(null);
    return Promise.resolve({
      article,
      broadcast: this.broadcastOf(article.id),
    });
  }

  listModerated(limit: number): Promise<ModeratedArticle[]> {
    return Promise.resolve(
      [...this.articles.values()]
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, limit)
        .map((article) => ({
          article,
          broadcast: this.broadcastOf(article.id),
        })),
    );
  }

  setArticleStatus(
    articleRecordId: string,
    status: ArticleStatus,
  ): Promise<void> {
    const article = this.articles.get(articleRecordId);
    if (article) article.status = status;
    return Promise.resolve();
  }

  findArticleByRecordId(id: string): Promise<ArticleRecord | null> {
    return Promise.resolve(this.articles.get(id) ?? null);
  }

  private broadcastOf(articleRecordId: string): ArticleBroadcastRecord | null {
    return (
      [...this.broadcasts.values()].find(
        (broadcast) => broadcast.articleRecordId === articleRecordId,
      ) ?? null
    );
  }
}

export class RecordingBroadcastMailer implements ArticleBroadcastMailer {
  readonly sent: string[] = [];
  readonly failingEmails = new Set<string>();
  enabled = true;

  isEnabled(): boolean {
    return this.enabled;
  }

  send(_article: ArticleRecord, recipient: BroadcastRecipient): Promise<void> {
    if (this.failingEmails.has(recipient.email)) {
      return Promise.reject(
        new Error(`550 mailbox unavailable <${recipient.email}>`),
      );
    }
    this.sent.push(recipient.email);
    return Promise.resolve();
  }
}
