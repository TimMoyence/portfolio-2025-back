import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import {
  buildArticleDeliveryRecord,
  buildArticleRecord,
  createMockArticlesRepository,
} from '../../../../test/factories/article.factory';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validArticleIngestEnvelope as payload } from '../../../../test/factories/article-ingest.factory';
import { RACINE } from '../../../../test/helpers/depot/racine';
import type { ArticleIngere } from '../domain/article-contract';
import type { ArticleRecord } from './articles.repository';
import { ArticlesService } from './articles.service';

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
});

describe('ArticlesService — lecture publique', () => {
  const RECIT = JSON.parse(
    readFileSync(
      join(RACINE, 'test/fixtures/articles/enveloppe-recit-du-matin.json'),
      'utf8',
    ),
  ).article as ArticleIngere;
  const avecDecalage = (valeur: unknown): unknown =>
    JSON.parse(
      JSON.stringify(valeur).replace(
        /"publie_le":("[^"]*"|null)/g,
        '"publie_le":"2026-11-08T07:15:00+01:00"',
      ),
    );
  const datesServies = (articles: unknown[]): unknown[] =>
    [...JSON.stringify(articles).matchAll(/"publie_le":("[^"]*"|null)/g)].map(
      ([, date]) => JSON.parse(date),
    );

  const articleStockeAvecDecalage = (): ArticleRecord => ({
    ...articleRecord(),
    sections: avecDecalage(RECIT.sections) as ArticleRecord['sections'],
    sources: avecDecalage(RECIT.sources) as ArticleRecord['sources'],
  });

  it.each([
    [
      'GET /articles/:slug',
      1,
      async (service: ArticlesService) => [
        await service.getPublishedBySlug(payload.article.slug, 'fr'),
      ],
    ],
    [
      'GET /articles',
      2,
      async (service: ArticlesService) =>
        (await service.listPublished({ locale: 'fr', limit: 10 })).items,
    ],
  ] as const)(
    '%s sert la date de chaque source de chacun de ses %i articles en ISO UTC « Z », même stockée avec un décalage',
    async (_route, servis, lire) => {
      const repository = createMockArticlesRepository();
      repository.findPublishedBySlug.mockResolvedValue(
        articleStockeAvecDecalage(),
      );
      repository.listPublished.mockResolvedValue([
        articleStockeAvecDecalage(),
        articleStockeAvecDecalage(),
      ]);

      const articles = await lire(new ArticlesService(repository));

      expect(articles).toHaveLength(servis);
      const dates = datesServies(articles);
      expect(dates.length).toBeGreaterThan(servis * 3);
      expect(new Set(dates)).toEqual(new Set(['2026-11-08T06:15:00.000Z']));
    },
  );
});
describe('ArticlesService.listPublished', () => {
  const decalageLuPour = async (decalage: string): Promise<unknown> => {
    const repository = createMockArticlesRepository();
    repository.listPublished.mockResolvedValue([]);
    await new ArticlesService(repository).listPublished({
      locale: 'fr',
      limit: 10,
      cursor: Buffer.from(decalage, 'utf8').toString('base64url'),
    });
    return repository.listPublished.mock.calls[0]?.[0].offset;
  };

  it('reprend au decalage porte par le curseur', async () => {
    await expect(decalageLuPour('20')).resolves.toBe(20);
  });

  it.each(['-20', '2.5', '9007199254740992', 'abc'])(
    'repart du premier article pour un curseur qui porte %s',
    async (decalage) => {
      await expect(decalageLuPour(decalage)).resolves.toBe(0);
    },
  );
});

describe('ArticlesService.feed', () => {
  const feedOf = async (
    locale: SupportedLocale,
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
    expect(xml).toContain('<description>Qu&amp;#39;en dire ?</description>');
  });

  it('livre le résumé en texte aux lecteurs qui lisent la description comme du HTML', async () => {
    const xml = await feedOf('fr', [
      {
        ...articleRecord(),
        excerpt: 'Rust stabilise Vec<T> et <img src=https://t.example/p.gif>',
      },
    ]);
    const description =
      /<item>.*<description>(.*?)<\/description>/.exec(xml)?.[1] ?? '';
    const htmlLuParLeLecteur = description
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&amp;', '&');

    expect(htmlLuParLeLecteur).toBe(
      'Rust stabilise Vec&lt;T&gt; et &lt;img src=https://t.example/p.gif&gt;',
    );
  });

  it('reste un flux valide sans article publié', async () => {
    const xml = await feedOf('fr', []);

    expect(xml).toMatch(/<lastBuildDate>[^<]+GMT<\/lastBuildDate>/);
    expect(xml).not.toContain('<item>');
  });
});
