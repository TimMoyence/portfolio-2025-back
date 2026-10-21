import type { DataSource } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { buildArticleWrite } from '../../../../test/factories/article.factory';
import { mockTypeOrmRepository } from '../../../../test/factories/formation-entities.factory';
import { verifierPanneDEcritureTransmise } from '../../../../test/helpers/pannes-d-ecriture';
import { TypeOrmArticlesRepository } from './articles.repository';

describe('TypeOrmArticlesRepository.saveArticleAndDelivery', () => {
  const transaction = jest.fn();
  const depot = new TypeOrmArticlesRepository(
    mockTypeOrmRepository({ create: jest.fn((valeur: unknown) => valeur) }),
    mockTypeOrmRepository({ create: jest.fn((valeur: unknown) => valeur) }),
    { transaction } as unknown as DataSource,
  );

  const enregistrer = () =>
    depot.saveArticleAndDelivery(buildArticleWrite(), {
      deliveryId: 'mb-2026-09-23-fr',
      idempotencyKey: 'idempotency-1',
      nonce: 'nonce-1',
      status: 'accepted',
      attempts: 1,
      processedAt: new Date('2026-09-23T04:15:00.000Z'),
    });

  beforeEach(() => transaction.mockReset());

  it.each([
    ['UQ_article_delivery_nonce'],
    ['UQ_article_delivery_idempotency'],
    ['uq_articles_locale_slug'],
  ])(
    'traduit la violation de %s, gagnee par une livraison concurrente, en conflit 409',
    async (constraint) => {
      transaction.mockRejectedValue({ code: '23505', constraint });

      await expect(enregistrer()).rejects.toBeInstanceOf(ResourceConflictError);
    },
  );

  verifierPanneDEcritureTransmise(() => ({
    save: transaction,
    ecrire: enregistrer,
  }));
});
