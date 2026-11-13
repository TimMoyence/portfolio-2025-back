import type { DataSource } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import {
  buildArticleDeliveryWrite,
  buildArticleWrite,
} from '../../../../test/factories/diffusion/article.factory';
import { mockTypeOrmRepository } from '../../../../test/factories/formations/formation-entities.factory';
import { verifierPanneDEcritureTransmise } from '../../../../test/helpers/base/pannes-d-ecriture';
import { TypeOrmArticlesRepository } from './articles.repository';

describe('TypeOrmArticlesRepository.saveArticleAndDelivery', () => {
  const transaction = jest.fn();
  const depot = new TypeOrmArticlesRepository(
    mockTypeOrmRepository({ create: jest.fn((valeur: unknown) => valeur) }),
    mockTypeOrmRepository({ create: jest.fn((valeur: unknown) => valeur) }),
    { transaction } as unknown as DataSource,
  );

  const enregistrer = () =>
    depot.saveArticleAndDelivery(
      buildArticleWrite(),
      buildArticleDeliveryWrite(),
    );

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
