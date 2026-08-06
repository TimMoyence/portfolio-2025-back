/* eslint-disable @typescript-eslint/unbound-method */
import { Not, type Repository } from 'typeorm';
import { buildNewsletterSubscriber } from '../../../../../test/factories/newsletter-subscriber.factory';
import type { NewsletterSubscriberEntity } from '../entities/NewsletterSubscriber.entity';
import { NewsletterSubscriberRepositoryTypeORM } from '../NewsletterSubscriber.repository.typeorm';

/**
 * Couverture de la transition atomique vers `unsubscribed`.
 *
 * Le predicat `status != 'unsubscribed'` est ce qui fait arbitrer la
 * course par la base : sans lui, deux desabonnements concurrents
 * affectent tous deux une ligne et declenchent chacun les effets de
 * bord, dont un accuse de reception en double. Ce comportement n'etant
 * observable qu'a travers la requete emise, on l'asserte ici.
 */
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
    // Une requete concurrente a deja opere la transition : l'appelant ne
    // doit declencher aucun effet de bord.
    repo.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

    const result = await sut.markUnsubscribed(subscriber);

    expect(result).toBeNull();
    expect(repo.findOneOrFail).not.toHaveBeenCalled();
  });

  it('refuse un subscriber sans id', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = undefined;

    await expect(sut.markUnsubscribed(subscriber)).rejects.toThrow(
      'Cannot update a subscriber without an id',
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});
