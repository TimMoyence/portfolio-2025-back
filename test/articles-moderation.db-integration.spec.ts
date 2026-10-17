import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import { TypeOrmArticlesRepository } from '../src/modules/articles/infrastructure/articles.repository';
import { ArticleDeliveryEntity } from '../src/modules/articles/infrastructure/entities/article-delivery.entity';
import { ArticleEntity } from '../src/modules/articles/infrastructure/entities/article.entity';
import { buildArticleWrite } from './factories/article.factory';
import {
  describeDb,
  destroyDbIntegrationDataSource,
  initDbIntegrationDataSource,
} from './helpers/db-integration-datasource';

const NOW = new Date('2026-09-23T07:45:00.000Z');
const DELAI_MS = 60_000;

describeDb('moderation des articles (Postgres)', () => {
  let dataSource: DataSource;
  let articles: TypeOrmArticlesRepository;

  beforeAll(async () => {
    dataSource = await initDbIntegrationDataSource([
      ArticleEntity,
      ArticleDeliveryEntity,
    ]);
    articles = new TypeOrmArticlesRepository(
      dataSource.getRepository(ArticleEntity),
      dataSource.getRepository(ArticleDeliveryEntity),
      dataSource,
    );
  }, DELAI_MS);

  afterAll(async () => destroyDbIntegrationDataSource(dataSource));

  beforeEach(async () => {
    await dataSource.query('TRUNCATE article_deliveries, articles CASCADE');
  });

  async function publish(date: string): Promise<void> {
    const publication = new Date(`${date}T04:15:00.000Z`);
    await articles.saveArticleAndDelivery(
      buildArticleWrite({
        articleId: `morning-brief-${date}-fr`,
        slug: `morning-brief-${date}`,
        title: `Veille IA ${date}`,
        publishedAt: publication,
        updatedAt: publication,
      }),
      {
        deliveryId: `mb-${date}-fr`,
        idempotencyKey: `mb-${date}-fr`,
        nonce: randomUUID(),
        status: 'accepted',
        attempts: 1,
        processedAt: NOW,
      },
    );
  }

  it('retire un article des listes publiques et le liste en modération', async () => {
    await publish('2026-09-23');
    await publish('2026-09-22');
    const moderated = await articles.findByArticleId(
      'morning-brief-2026-09-23-fr',
    );

    await articles.setArticleStatus(moderated!.id, 'withdrawn');

    const published = await articles.listPublished({
      locale: 'fr',
      offset: 0,
      limit: 10,
    });
    expect(published.map((item) => item.slug)).toEqual([
      'morning-brief-2026-09-22',
    ]);
    await expect(
      articles.findPublishedBySlug('morning-brief-2026-09-23', 'fr'),
    ).resolves.toBeNull();
    const listed = await articles.listLatest(10);
    expect(listed.map((item) => [item.slug, item.status])).toEqual([
      ['morning-brief-2026-09-23', 'withdrawn'],
      ['morning-brief-2026-09-22', 'published'],
    ]);
  });

  it('borne la liste de modération aux plus récents', async () => {
    await publish('2026-09-21');
    await publish('2026-09-23');
    await publish('2026-09-22');

    const listed = await articles.listLatest(2);

    expect(listed.map((item) => item.slug)).toEqual([
      'morning-brief-2026-09-23',
      'morning-brief-2026-09-22',
    ]);
  });
});
