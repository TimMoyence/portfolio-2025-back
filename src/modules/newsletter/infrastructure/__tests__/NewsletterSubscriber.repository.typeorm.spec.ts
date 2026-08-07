/* eslint-disable @typescript-eslint/unbound-method */
import { Not, type Repository } from 'typeorm';
import { buildNewsletterSubscriber } from '../../../../../test/factories/newsletter-subscriber.factory';
import type { NewsletterSubscriberEntity } from '../entities/NewsletterSubscriber.entity';
import { NewsletterSubscriberRepositoryTypeORM } from '../NewsletterSubscriber.repository.typeorm';

describe('NewsletterSubscriberRepositoryTypeORM.markUnsubscribed', () => {
  let repo: jest.Mocked<Repository<NewsletterSubscriberEntity>>;
  let sut: NewsletterSubscriberRepositoryTypeORM;

  beforeEach(() => {
    repo = {
      update: jest.fn(),
      findOneOrFail: jest.fn(),
    } as unknown as jest.Mocked<Repository<NewsletterSubscriberEntity>>;
    sut = new NewsletterSubscriberRepositoryTypeORM(repo);
  });

  function buildUnsubscribed() {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = 'sub-id';
    subscriber.confirm();
    subscriber.unsubscribe();
    return subscriber;
  }

  it('conditionne l’UPDATE au statut en base', async () => {
    const subscriber = buildUnsubscribed();
    repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
    repo.findOneOrFail.mockResolvedValue({
      id: 'sub-id',
      email: subscriber.email,
      firstName: subscriber.firstName,
      locale: subscriber.locale,
      sourceFormationSlug: subscriber.sourceFormationSlug,
      status: 'unsubscribed',
      confirmToken: subscriber.confirmToken,
      confirmTokenExpiresAt: subscriber.confirmTokenExpiresAt,
      lastConfirmationSentAt: subscriber.lastConfirmationSentAt,
      confirmedAt: subscriber.confirmedAt,
      unsubscribedAt: subscriber.unsubscribedAt,
      unsubscribeToken: subscriber.unsubscribeToken,
      termsVersion: subscriber.termsVersion,
      termsAcceptedAt: subscriber.termsAcceptedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as NewsletterSubscriberEntity);

    await sut.markUnsubscribed(subscriber);

    const [criteria] = repo.update.mock.calls[0];
    expect(criteria).toEqual({
      id: 'sub-id',
      status: Not('unsubscribed'),
    });
  });

  it('retourne null quand aucune ligne n’a ete affectee', async () => {
    const subscriber = buildUnsubscribed();
    repo.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

    const result = await sut.markUnsubscribed(subscriber);

    expect(result).toBeNull();
    expect(repo.findOneOrFail).not.toHaveBeenCalled();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])(
    'laisse passer les effets de bord quand affected vaut %s',
    async (_label, affected) => {
      const subscriber = buildUnsubscribed();
      repo.update.mockResolvedValue({
        affected,
        raw: [],
        generatedMaps: [],
      } as never);
      repo.findOneOrFail.mockResolvedValue({
        id: 'sub-id',
        status: 'unsubscribed',
      } as unknown as NewsletterSubscriberEntity);

      const result = await sut.markUnsubscribed(subscriber);

      expect(result).not.toBeNull();
      expect(repo.findOneOrFail).toHaveBeenCalled();
    },
  );

  it('refuse un subscriber sans id', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = undefined;

    await expect(sut.markUnsubscribed(subscriber)).rejects.toThrow(
      'Cannot update a subscriber without an id',
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});
