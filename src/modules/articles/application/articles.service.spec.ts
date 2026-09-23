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

  it('programme la diffusion abonnés dans la même écriture que l article', async () => {
    const previous = process.env.ARTICLE_BROADCAST_DELAY_MINUTES;
    process.env.ARTICLE_BROADCAST_DELAY_MINUTES = '45';
    const saveArticleAndDelivery = jest.fn().mockResolvedValue(undefined);
    const repository = {
      findDeliveryByDeliveryOrIdempotency: jest.fn().mockResolvedValue(null),
      findDeliveryByNonce: jest.fn().mockResolvedValue(null),
      saveArticleAndDelivery,
    } as unknown as ArticlesRepository;
    const service = new ArticlesService(repository);

    try {
      const result = await service.ingest(payload, 'idempotency-1', 'nonce-1');
      const [, , broadcast] = saveArticleAndDelivery.mock.calls[0] as [
        unknown,
        unknown,
        { sendAfter: Date },
      ];

      expect(broadcast.sendAfter.getTime()).toBe(
        Date.parse(result.received_at) + 45 * 60_000,
      );
    } finally {
      if (previous === undefined)
        delete process.env.ARTICLE_BROADCAST_DELAY_MINUTES;
      else process.env.ARTICLE_BROADCAST_DELAY_MINUTES = previous;
    }
  });
});

describe('ArticlesService.feed', () => {
  const feedOf = async (
    locale: 'fr' | 'en',
    records: ArticleRecord[],
  ): Promise<string> => {
    const repository = {
      listPublished: jest.fn().mockResolvedValue(records),
    } as unknown as ArticlesRepository;
    return new ArticlesService(repository).feed(locale);
  };

  it('déclare le flux, sa langue, son auto-lien et sa date de génération', async () => {
    const xml = await feedOf('fr', [articleRecord()]);

    expect(xml).toContain(
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    );
    expect(xml).toContain(
      '<atom:link href="https://asilidesign.fr/api/v1/portfolio25/articles/feed.xml?locale=fr" rel="self" type="application/rss+xml"/>',
    );
    expect(xml).toContain('<language>fr-FR</language>');
    expect(xml).toMatch(
      /<channel><title>[^<]+<\/title><link>[^<]+<\/link><description>[^<]+<\/description>/,
    );
    expect(xml).toContain(
      `<lastBuildDate>${articleRecord().updatedAt.toUTCString()}</lastBuildDate>`,
    );
  });

  it('date chaque article en RFC 822 et pointe vers sa page localisée', async () => {
    const xml = await feedOf('en', [{ ...articleRecord(), locale: 'en' }]);

    expect(xml).toContain(
      `<pubDate>${articleRecord().publishedAt.toUTCString()}</pubDate>`,
    );
    expect(xml).toContain(
      `<link>https://asilidesign.fr/en/articles/${payload.article.slug}</link>`,
    );
    expect(xml).toContain('<language>en</language>');
  });

  it('reste un flux valide sans article publié', async () => {
    const xml = await feedOf('fr', []);

    expect(xml).toMatch(/<lastBuildDate>[^<]+GMT<\/lastBuildDate>/);
    expect(xml).not.toContain('<item>');
  });
});
