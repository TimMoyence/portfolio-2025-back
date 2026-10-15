import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import {
  buildArticleDeliveryRecord,
  buildArticleRecord,
  createMockArticlesRepository,
} from '../../../../test/factories/article.factory';
import { sousEnvironnement } from '../../../../test/helpers/environnement';
import type { ArticleRecord } from './articles.repository';
import { ArticlesService } from './articles.service';
import { validArticleIngestEnvelope as payload } from '../testing/article-ingest.fixture';

const articleId = payload.article.article_id;
const articleRecord = (): ArticleRecord =>
  buildArticleRecord({
    articleId,
    slug: payload.article.slug,
    contentSha256: payload.article.provenance.content_sha256,
  });
const deliveryRecord = () =>
  buildArticleDeliveryRecord({ deliveryId: payload.delivery_id });

describe('ArticlesService', () => {
  it('persiste une livraison valide puis rejoue le même input sans écriture', async () => {
    const repository = createMockArticlesRepository();
    repository.findDeliveryByDeliveryOrIdempotency
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(deliveryRecord());
    repository.findDeliveryByNonce.mockResolvedValue(null);
    repository.findArticleByRecordId.mockResolvedValue(articleRecord());
    const service = new ArticlesService(repository);

    const first = await service.ingest(payload, 'idempotency-1', 'nonce-1');
    const duplicate = await service.ingest(payload, 'idempotency-1', 'nonce-1');

    expect(first).toMatchObject({ article_id: articleId, duplicate: false });
    expect(duplicate).toMatchObject({ article_id: articleId, duplicate: true });
    expect(repository.saveArticleAndDelivery.mock.calls).toHaveLength(1);
  });

  it('refuse de réutiliser une clé d idempotence pour un autre article', async () => {
    const repository = createMockArticlesRepository();
    repository.findDeliveryByDeliveryOrIdempotency.mockResolvedValue(
      deliveryRecord(),
    );
    repository.findArticleByRecordId.mockResolvedValue(articleRecord());
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
    ).rejects.toBeInstanceOf(ResourceConflictError);
  });

  it('refuse une livraison hors contrat ou sans clé d idempotence par une erreur de domaine', async () => {
    const service = new ArticlesService(createMockArticlesRepository());

    await expect(
      service.ingest({ article: {} }, 'idempotency-1', 'nonce-1'),
    ).rejects.toBeInstanceOf(InvalidInputError);
    await expect(service.ingest(payload, '', 'nonce-1')).rejects.toBeInstanceOf(
      InvalidInputError,
    );
  });

  it('signale une livraison ou un article introuvable par une erreur de domaine', async () => {
    const repository = createMockArticlesRepository();
    repository.findDelivery.mockResolvedValue(null);
    repository.findPublishedBySlug.mockResolvedValue(null);
    const service = new ArticlesService(repository);

    await expect(
      service.getDelivery(payload.delivery_id),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(
      service.getPublishedBySlug(payload.article.slug, 'fr'),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(repository.findDelivery.mock.calls).toEqual([[payload.delivery_id]]);
    expect(repository.findPublishedBySlug.mock.calls).toHaveLength(1);
  });

  it.each([
    [
      'un slug',
      (service: ArticlesService) =>
        service.getPublishedBySlug(`${payload.article.slug}\u0000`, 'fr'),
      'findPublishedBySlug',
    ],
    [
      'une livraison',
      (service: ArticlesService) =>
        service.getDelivery(`${payload.delivery_id}\u0000`),
      'findDelivery',
    ],
  ] as const)(
    'répond 404 sans interroger la base pour %s hors contrat',
    async (_nom, lire, lecture) => {
      const repository = createMockArticlesRepository();

      await expect(
        lire(new ArticlesService(repository)),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
      expect(repository[lecture].mock.calls).toHaveLength(0);
    },
  );

  it('programme la diffusion abonnés dans la même écriture que l article', async () => {
    const repository = createMockArticlesRepository();
    repository.findDeliveryByDeliveryOrIdempotency.mockResolvedValue(null);
    repository.findDeliveryByNonce.mockResolvedValue(null);
    const service = new ArticlesService(repository);

    const result = await sousEnvironnement(
      { ARTICLE_BROADCAST_DELAY_MINUTES: '45' },
      () => service.ingest(payload, 'idempotency-1', 'nonce-1'),
    );
    const [, , broadcast] = repository.saveArticleAndDelivery.mock.calls[0];

    expect(broadcast.sendAfter.getTime()).toBe(
      Date.parse(result.received_at) + 45 * 60_000,
    );
  });
});

describe('ArticlesService.feed', () => {
  const feedOf = async (
    locale: 'fr' | 'en',
    records: ArticleRecord[],
  ): Promise<string> => {
    const repository = createMockArticlesRepository();
    repository.listPublished.mockResolvedValue(records);
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

  it('échappe le titre et le résumé d un article comme le reste du HTML servi', async () => {
    const xml = await feedOf('fr', [
      {
        ...articleRecord(),
        title: `L'IA <vraie> & "fausse"`,
        excerpt: `Qu'en dire ?`,
      },
    ]);

    expect(xml).toContain(
      '<title>L&#39;IA &lt;vraie&gt; &amp; &quot;fausse&quot;</title>',
    );
    expect(xml).toContain('<description>Qu&#39;en dire ?</description>');
  });

  it('reste un flux valide sans article publié', async () => {
    const xml = await feedOf('fr', []);

    expect(xml).toMatch(/<lastBuildDate>[^<]+GMT<\/lastBuildDate>/);
    expect(xml).not.toContain('<item>');
  });
});
