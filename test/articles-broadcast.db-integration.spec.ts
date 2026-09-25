import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { ArticleWrite } from '../src/modules/articles/application/articles.repository';
import { TypeOrmArticleBroadcastRepository } from '../src/modules/articles/infrastructure/article-broadcast.repository';
import { TypeOrmArticlesRepository } from '../src/modules/articles/infrastructure/articles.repository';
import { ArticleBroadcastRecipientEntity } from '../src/modules/articles/infrastructure/entities/article-broadcast-recipient.entity';
import { ArticleBroadcastEntity } from '../src/modules/articles/infrastructure/entities/article-broadcast.entity';
import { ArticleDeliveryEntity } from '../src/modules/articles/infrastructure/entities/article-delivery.entity';
import { ArticleEntity } from '../src/modules/articles/infrastructure/entities/article.entity';
import { NewsletterSubscriberEntity } from '../src/modules/newsletter/infrastructure/entities/NewsletterSubscriber.entity';
import { buildArticleWrite } from './factories/article.factory';
import {
  describeDb,
  destroyDbIntegrationDataSource,
  initDbIntegrationDataSource,
} from './helpers/db-integration-datasource';

const NOW = new Date('2026-09-23T07:45:00.000Z');
const DELAI_MS = 60_000;

function article(date: string, locale: 'fr' | 'en' = 'fr'): ArticleWrite {
  const publication = new Date(`${date}T04:15:00.000Z`);
  return buildArticleWrite({
    articleId: `morning-brief-${date}-${locale}`,
    slug: `morning-brief-${date}`,
    locale,
    title: `Veille IA ${date}`,
    publishedAt: publication,
    updatedAt: publication,
  });
}

describeDb('diffusion des articles aux abonnés (Postgres)', () => {
  let dataSource: DataSource;
  let articles: TypeOrmArticlesRepository;
  let broadcasts: TypeOrmArticleBroadcastRepository;

  beforeAll(async () => {
    dataSource = await initDbIntegrationDataSource([
      ArticleEntity,
      ArticleDeliveryEntity,
      ArticleBroadcastEntity,
      ArticleBroadcastRecipientEntity,
      NewsletterSubscriberEntity,
    ]);
    articles = new TypeOrmArticlesRepository(
      dataSource.getRepository(ArticleEntity),
      dataSource.getRepository(ArticleDeliveryEntity),
      dataSource,
    );
    broadcasts = new TypeOrmArticleBroadcastRepository(dataSource);
  }, DELAI_MS);

  afterAll(async () => destroyDbIntegrationDataSource(dataSource));

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE article_broadcast_recipients, article_broadcasts, article_deliveries, articles, newsletter_subscribers CASCADE',
    );
  });

  async function publish(
    date: string,
    sendAfter: Date,
    locale: 'fr' | 'en' = 'fr',
  ): Promise<string> {
    await articles.saveArticleAndDelivery(
      article(date, locale),
      {
        deliveryId: `mb-${date}-${locale}`,
        idempotencyKey: `mb-${date}-${locale}`,
        nonce: randomUUID(),
        status: 'accepted',
        attempts: 1,
        processedAt: NOW,
      },
      { sendAfter },
    );
    const moderated = await broadcasts.findModerated(
      `morning-brief-${date}-${locale}`,
    );
    return moderated!.broadcast!.id;
  }

  async function subscriber(
    email: string,
    overrides: Partial<NewsletterSubscriberEntity> = {},
  ): Promise<string> {
    const saved = await dataSource
      .getRepository(NewsletterSubscriberEntity)
      .save({
        email,
        firstName: null,
        locale: 'fr',
        sourceFormationSlug: 'veille-ia',
        status: 'confirmed',
        confirmToken: randomUUID(),
        unsubscribeToken: randomUUID(),
        termsVersion: '2026-09-23',
        termsAcceptedAt: NOW,
        confirmTokenExpiresAt: NOW,
        lastConfirmationSentAt: null,
        confirmedAt: NOW,
        unsubscribedAt: null,
        ...overrides,
      });
    return saved.id;
  }

  it('programme la diffusion dans la transaction de l article', async () => {
    await publish('2026-09-23', NOW);

    const moderated = await broadcasts.findModerated(
      'morning-brief-2026-09-23-fr',
    );
    expect(moderated?.broadcast).toMatchObject({
      status: 'scheduled',
      sendAfter: NOW,
      sentCount: 0,
      failedCount: 0,
      lockedUntil: null,
    });
  });

  it('ne réclame une diffusion due qu une fois tant que le bail court', async () => {
    const id = await publish('2026-09-23', NOW);
    const lease = new Date(NOW.getTime() + 600_000);

    const [first, second] = await Promise.all([
      broadcasts.claimDue(NOW, lease),
      broadcasts.claimDue(NOW, lease),
    ]);

    expect([first?.id, second?.id].filter(Boolean)).toEqual([id]);
    await expect(broadcasts.claimDue(NOW, lease)).resolves.toBeNull();
    await expect(
      broadcasts.claimDue(new Date(lease.getTime() + 1), lease),
    ).resolves.toMatchObject({ id, status: 'sending' });
  });

  it('ne réclame pas une diffusion avant son heure', async () => {
    await publish('2026-09-23', new Date(NOW.getTime() + 1));

    await expect(broadcasts.claimDue(NOW, NOW)).resolves.toBeNull();
  });

  it('cible les confirmés de la veille dans la langue et exclut les réservés', async () => {
    const id = await publish('2026-09-23', NOW);
    const fr = await subscriber('fr@example.com');
    const frFr = await subscriber('frfr@example.com', { locale: 'fr-FR' });
    await subscriber('en@example.com', { locale: 'en' });
    await subscriber('formation@example.com', {
      sourceFormationSlug: 'ia-solopreneurs',
    });
    await subscriber('pending@example.com', { status: 'pending' });

    const recherche = {
      broadcastId: id,
      source: 'veille-ia',
      locale: 'fr',
      limit: 10,
    } as const;
    const pending = await broadcasts.findPendingRecipients(recherche);
    expect(pending.map((recipient) => recipient.subscriberId)).toHaveLength(2);
    expect(pending.map((recipient) => recipient.subscriberId)).toEqual(
      expect.arrayContaining([fr, frFr]),
    );

    await expect(broadcasts.reserveRecipient(id, fr)).resolves.toBe(true);
    await expect(broadcasts.reserveRecipient(id, fr)).resolves.toBe(false);
    await broadcasts.markRecipient(id, fr, 'failed', '550 [redacted]');

    const remaining = await broadcasts.findPendingRecipients(recherche);
    expect(remaining.map((recipient) => recipient.subscriberId)).toEqual([
      frFr,
    ]);
    const [row] = await dataSource.query(
      'SELECT status, error, "processedAt" FROM article_broadcast_recipients WHERE "subscriberId" = $1',
      [fr],
    );
    expect(row).toMatchObject({ status: 'failed', error: '550 [redacted]' });
    expect(row.processedAt).not.toBeNull();
  });

  it('retire un article des listes publiques et le liste en modération', async () => {
    const id = await publish('2026-09-23', NOW);
    await publish('2026-09-22', NOW);
    const moderated = await broadcasts.findModerated(
      'morning-brief-2026-09-23-fr',
    );

    await broadcasts.setArticleStatus(moderated!.article.id, 'withdrawn');
    await broadcasts.updateBroadcast(id, {
      status: 'cancelled',
      completedAt: NOW,
    });

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
    const listed = await broadcasts.listModerated(10);
    expect(
      listed.map((item) => [
        item.article.slug,
        item.article.status,
        item.broadcast?.status,
      ]),
    ).toEqual([
      ['morning-brief-2026-09-23', 'withdrawn', 'cancelled'],
      ['morning-brief-2026-09-22', 'published', 'scheduled'],
    ]);
  });
});
