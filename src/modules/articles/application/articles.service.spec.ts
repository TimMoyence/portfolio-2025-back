import { ConflictException } from '@nestjs/common';
import {
  type ArticleDeliveryRecord,
  type ArticleRecord,
  type ArticlesRepository,
} from './articles.repository';
import { ArticlesService } from './articles.service';
import { validArticleIngestEnvelope as payload } from '../testing/article-ingest.fixture';

const articleId = payload.article.article_id;
const articleRecord = (): ArticleRecord => ({
  id: 'record-1',
  articleId,
  slug: payload.article.slug,
  locale: 'fr',
  status: 'published',
  title: payload.article.title,
  excerpt: payload.article.excerpt,
  contentMarkdown: payload.article.content_markdown,
  readingTimeMinutes: null,
  tags: [],
  sections: payload.article.sections,
  sources: payload.article.sources,
  provenance: payload.article.provenance,
  seo: payload.article.seo,
  publishedAt: new Date(payload.article.published_at),
  updatedAt: new Date(payload.article.updated_at),
  contentSha256: payload.article.provenance.content_sha256,
});

const deliveryRecord = (): ArticleDeliveryRecord => ({
  deliveryId: payload.delivery_id,
  idempotencyKey: 'idempotency-1',
  nonce: 'nonce-1',
  articleRecordId: 'record-1',
  status: 'accepted',
  attempts: 1,
  processedAt: new Date(payload.article.published_at),
  receivedAt: new Date(payload.article.published_at),
});

describe('ArticlesService', () => {
  it('persiste une livraison valide puis rejoue le même input sans écriture', async () => {
    const saveArticleAndDelivery = jest.fn().mockResolvedValue(undefined);
    const repository = {
      findDelivery: jest.fn(),
      findDeliveryByDeliveryOrIdempotency: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(deliveryRecord()),
      findDeliveryByNonce: jest.fn().mockResolvedValue(null),
      findArticleByRecordId: jest.fn().mockResolvedValue(articleRecord()),
      saveArticleAndDelivery,
    } as unknown as ArticlesRepository;
    const service = new ArticlesService(repository);

    const first = await service.ingest(payload, 'idempotency-1', 'nonce-1');
    const duplicate = await service.ingest(payload, 'idempotency-1', 'nonce-1');

    expect(first).toMatchObject({ article_id: articleId, duplicate: false });
    expect(duplicate).toMatchObject({ article_id: articleId, duplicate: true });
    expect(saveArticleAndDelivery).toHaveBeenCalledTimes(1);
  });

  it('refuse de réutiliser une clé d idempotence pour un autre article', async () => {
    const repository = {
      findDelivery: jest.fn(),
      findDeliveryByDeliveryOrIdempotency: jest
        .fn()
        .mockResolvedValue(deliveryRecord()),
      findArticleByRecordId: jest.fn().mockResolvedValue(articleRecord()),
    } as unknown as ArticlesRepository;
    const service = new ArticlesService(repository);
    const otherPayload = {
      ...payload,
      article: {
        ...payload.article,
        article_id: 'morning-brief-2026-09-09-en',
      },
    };

    await expect(
      service.ingest(otherPayload, 'idempotency-1', 'nonce-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
