import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import type { ArticleIngere } from '../domain/article-contract';

export const ARTICLES_REPOSITORY = Symbol('ARTICLES_REPOSITORY');

export const STATUTS_D_ARTICLE = ['published', 'withdrawn'] as const;

export type ArticleStatus = (typeof STATUTS_D_ARTICLE)[number];

export interface ArticleRecord {
  id: string;
  articleId: string;
  slug: string;
  locale: SupportedLocale;
  status: ArticleStatus;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  readingTimeMinutes: number | null;
  tags: string[];
  sections: ArticleIngere['sections'];
  sources: ArticleIngere['sources'];
  provenance: ArticleIngere['provenance'];
  seo: ArticleIngere['seo'];
  publishedAt: Date;
  updatedAt: Date;
  contentSha256: string;
}

export interface ArticleWrite extends Omit<
  ArticleRecord,
  'id' | 'contentSha256'
> {
  contentSha256: string;
}

export interface ArticleDeliveryRecord {
  deliveryId: string;
  idempotencyKey: string;
  nonce: string;
  articleRecordId: string;
  status: 'accepted';
  attempts: number;
  processedAt: Date | null;
  receivedAt: Date;
}

export interface ArticleDeliveryWrite {
  deliveryId: string;
  idempotencyKey: string;
  nonce: string;
  status: 'accepted';
  attempts: number;
  processedAt: Date;
}

export interface PagePubliee {
  locale: SupportedLocale;
  tag?: string;
  offset: number;
  limit: number;
}

export interface ArticlesRepository {
  findDelivery(deliveryId: string): Promise<ArticleDeliveryRecord | null>;
  findDeliveryByDeliveryOrIdempotency(
    deliveryId: string,
    idempotencyKey: string,
  ): Promise<ArticleDeliveryRecord | null>;
  findDeliveryByNonce(nonce: string): Promise<ArticleDeliveryRecord | null>;
  findArticleByRecordId(id: string): Promise<ArticleRecord | null>;
  saveArticleAndDelivery(
    article: ArticleWrite,
    delivery: ArticleDeliveryWrite,
  ): Promise<void>;
  listPublished(params: PagePubliee): Promise<ArticleRecord[]>;
  findPublishedBySlug(
    slug: string,
    locale: SupportedLocale,
  ): Promise<ArticleRecord | null>;
  findByArticleId(articleId: string): Promise<ArticleRecord | null>;
  listLatest(limit: number): Promise<ArticleRecord[]>;
  setArticleStatus(
    articleRecordId: string,
    status: ArticleStatus,
  ): Promise<void>;
}

export type ArticleModerationRepository = Pick<
  ArticlesRepository,
  'findByArticleId' | 'listLatest' | 'setArticleStatus'
>;
