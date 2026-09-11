export const ARTICLES_REPOSITORY = Symbol('ARTICLES_REPOSITORY');

export interface ArticleRecord {
  id: string;
  articleId: string;
  slug: string;
  locale: 'fr' | 'en';
  status: 'published';
  title: string;
  excerpt: string;
  contentMarkdown: string;
  readingTimeMinutes: number | null;
  tags: string[];
  sections: unknown[];
  sources: unknown[];
  provenance: Record<string, unknown>;
  seo: Record<string, unknown>;
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
  listPublished(params: {
    locale: 'fr' | 'en';
    tag?: string;
    offset: number;
    limit: number;
  }): Promise<ArticleRecord[]>;
  findPublishedBySlug(
    slug: string,
    locale: 'fr' | 'en',
  ): Promise<ArticleRecord | null>;
}
