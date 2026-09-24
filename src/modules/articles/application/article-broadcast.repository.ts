import type { ArticleRecord, ArticleStatus } from './articles.repository';

export const ARTICLE_BROADCAST_REPOSITORY = Symbol(
  'ARTICLE_BROADCAST_REPOSITORY',
);
export const ARTICLE_BROADCAST_MAILER = Symbol('ARTICLE_BROADCAST_MAILER');

export type ArticleBroadcastStatus =
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'cancelled'
  | 'expired';

export interface ArticleBroadcastRecord {
  id: string;
  articleRecordId: string;
  status: ArticleBroadcastStatus;
  sendAfter: Date;
  lockedUntil: Date | null;
  sentCount: number;
  failedCount: number;
  completedAt: Date | null;
}

export interface ArticleBroadcastPatch {
  status?: ArticleBroadcastStatus;
  sendAfter?: Date;
  lockedUntil?: Date | null;
  sentCount?: number;
  failedCount?: number;
  completedAt?: Date | null;
}

export interface BroadcastRecipient {
  subscriberId: string;
  email: string;
  firstName: string | null;
  unsubscribeToken: string;
}

export interface ModeratedArticle {
  article: ArticleRecord;
  broadcast: ArticleBroadcastRecord | null;
}

export interface ArticleBroadcastRepository {
  claimDue(
    now: Date,
    lockedUntil: Date,
  ): Promise<ArticleBroadcastRecord | null>;
  findPendingRecipients(
    broadcastId: string,
    source: string,
    locale: 'fr' | 'en',
    limit: number,
  ): Promise<BroadcastRecipient[]>;
  reserveRecipient(broadcastId: string, subscriberId: string): Promise<boolean>;
  markRecipient(
    broadcastId: string,
    subscriberId: string,
    status: 'sent' | 'failed',
    error: string | null,
  ): Promise<void>;
  updateBroadcast(id: string, patch: ArticleBroadcastPatch): Promise<void>;
  findModerated(articleId: string): Promise<ModeratedArticle | null>;
  listModerated(limit: number): Promise<ModeratedArticle[]>;
  setArticleStatus(
    articleRecordId: string,
    status: ArticleStatus,
  ): Promise<void>;
}

export interface ArticleBroadcastMailer {
  isEnabled(): boolean;
  send(article: ArticleRecord, recipient: BroadcastRecipient): Promise<void>;
}
