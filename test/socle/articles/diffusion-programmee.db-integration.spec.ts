import { ArticleBroadcastEntity } from '../../../src/modules/articles/infrastructure/entities/article-broadcast.entity';
import { ArticleDeliveryEntity } from '../../../src/modules/articles/infrastructure/entities/article-delivery.entity';
import { ArticleEntity } from '../../../src/modules/articles/infrastructure/entities/article.entity';
import { TypeOrmArticlesRepository } from '../../../src/modules/articles/infrastructure/articles.repository';
import {
  buildArticleDeliveryWrite,
  buildArticleWrite,
} from '../../factories/diffusion/article.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  TOUTES_LES_MIGRATIONS,
} from '../../helpers/base/db-integration-datasource';

const LIVRAISON = buildArticleDeliveryWrite();

describeDb('Diffusion programmée à la réception (Postgres)', () => {
  const base = baseMigreeDeLaSuite(
    [ArticleEntity, ArticleDeliveryEntity, ArticleBroadcastEntity],
    [TOUTES_LES_MIGRATIONS],
  );
  const depot = () =>
    new TypeOrmArticlesRepository(
      base().getRepository(ArticleEntity),
      base().getRepository(ArticleDeliveryEntity),
      base(),
    );

  beforeEach(async () => {
    await base().query(
      'TRUNCATE article_broadcasts, article_deliveries, articles CASCADE',
    );
  });

  it('NL-04 · enregistre la diffusion programmee dans la transaction de l article', async () => {
    await depot().saveArticleAndDelivery(buildArticleWrite(), LIVRAISON, {
      envoiApres: new Date('2026-09-23T05:45:00.000Z'),
    });

    const diffusions: { status: string; send_after: Date }[] =
      await base().query(
        'SELECT "status", "send_after" FROM "article_broadcasts"',
      );
    expect(diffusions).toEqual([
      { status: 'scheduled', send_after: new Date('2026-09-23T05:45:00.000Z') },
    ]);
  });

  it('NL-12 · n enregistre aucune diffusion quand rien n est programme', async () => {
    await depot().saveArticleAndDelivery(buildArticleWrite(), LIVRAISON, null);

    expect(await base().query('SELECT 1 FROM "article_broadcasts"')).toEqual(
      [],
    );
    expect(await base().query('SELECT 1 FROM "articles"')).toHaveLength(1);
  });
});
