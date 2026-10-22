import type {
  ArticleDeliveryRecord,
  ArticleModerationRepository,
  ArticleRecord,
  ArticlesRepository,
  ArticleStatus,
  ArticleWrite,
} from '../../src/modules/articles/application/articles.repository';
import { validArticleIngestEnvelope } from './article-ingest.factory';

export function buildArticleWrite(
  overrides: Partial<ArticleWrite> = {},
): ArticleWrite {
  return {
    articleId: 'morning-brief-2026-09-23-fr',
    slug: 'morning-brief-2026-09-23',
    locale: 'fr',
    status: 'published',
    title: 'Veille IA du 23 septembre',
    excerpt: 'Les faits IA du jour, sourcés.',
    contentMarkdown: '# Veille',
    readingTimeMinutes: 6,
    tags: [],
    sections: [],
    sources: [],
    provenance: validArticleIngestEnvelope.article.provenance,
    seo: validArticleIngestEnvelope.article.seo,
    publishedAt: new Date('2026-09-23T04:15:00.000Z'),
    updatedAt: new Date('2026-09-23T04:15:00.000Z'),
    contentSha256: 'a'.repeat(64),
    ...overrides,
  };
}

export function createMockArticlesService() {
  return {
    ingest: jest.fn(),
    getDelivery: jest.fn(),
    listPublished: jest.fn(),
    getPublishedBySlug: jest.fn(),
    feed: jest.fn(),
  };
}

export function buildArticleRecord(
  overrides: Partial<ArticleRecord> = {},
): ArticleRecord {
  return { id: 'record-1', ...buildArticleWrite(), ...overrides };
}

export function buildArticleDeliveryRecord(
  overrides: Partial<ArticleDeliveryRecord> = {},
): ArticleDeliveryRecord {
  return {
    deliveryId: 'delivery-1',
    idempotencyKey: 'idempotency-1',
    nonce: 'nonce-1',
    articleRecordId: 'record-1',
    status: 'accepted',
    attempts: 1,
    processedAt: new Date('2026-09-23T04:15:00.000Z'),
    receivedAt: new Date('2026-09-23T04:15:00.000Z'),
    ...overrides,
  };
}

export function createMockArticlesRepository(): jest.Mocked<ArticlesRepository> {
  return {
    findDelivery: jest.fn(),
    findDeliveryByDeliveryOrIdempotency: jest.fn(),
    findDeliveryByNonce: jest.fn(),
    findArticleByRecordId: jest.fn(),
    saveArticleAndDelivery: jest.fn(),
    listPublished: jest.fn(),
    findPublishedBySlug: jest.fn(),
    findByArticleId: jest.fn(),
    listLatest: jest.fn(),
    setArticleStatus: jest.fn(),
  };
}

export class ArticlesEnMemoire implements ArticleModerationRepository {
  readonly articles = new Map<string, ArticleRecord>();

  findByArticleId(articleId: string): Promise<ArticleRecord | null> {
    return Promise.resolve(
      [...this.articles.values()].find(
        (candidate) => candidate.articleId === articleId,
      ) ?? null,
    );
  }

  listLatest(limit: number): Promise<ArticleRecord[]> {
    return Promise.resolve(
      [...this.articles.values()]
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, limit),
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
}
