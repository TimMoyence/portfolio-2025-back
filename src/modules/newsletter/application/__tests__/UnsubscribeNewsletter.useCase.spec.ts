/* eslint-disable @typescript-eslint/unbound-method */
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import {
  buildAbonnePersiste,
  createMockEmailDripScheduler,
  createMockNewsletterMailer,
  createMockNewsletterSubscriberRepo,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import { flushPromises } from '../../../../../test/helpers/flush-promises';
import type { NewsletterSubscriber } from '../../domain/NewsletterSubscriber';
import { UnsubscribeNewsletterUseCase } from '../UnsubscribeNewsletter.useCase';

const confirme = (abonne: NewsletterSubscriber) => abonne.confirm();

describe('UnsubscribeNewsletterUseCase', () => {
  let repo: ReturnType<typeof createMockNewsletterSubscriberRepo>;
  let mailer: ReturnType<typeof createMockNewsletterMailer>;
  let scheduler: ReturnType<typeof createMockEmailDripScheduler>;
  let useCase: UnsubscribeNewsletterUseCase;

  const desabonner = async (
    abonne: NewsletterSubscriber,
    options?: { sendAck: boolean },
  ) => {
    repo.findByUnsubscribeToken.mockResolvedValueOnce(abonne);
    const result = await useCase.execute(abonne.unsubscribeToken, options);
    await flushPromises();
    return result;
  };

  beforeEach(() => {
    repo = createMockNewsletterSubscriberRepo();
    mailer = createMockNewsletterMailer();
    scheduler = createMockEmailDripScheduler();
    useCase = new UnsubscribeNewsletterUseCase(repo, mailer, scheduler);
  });

  it.each([
    ['envoie l’accuse par defaut', undefined, 1],
    [
      'n’envoie pas d’accuse quand sendAck vaut false (one-click)',
      { sendAck: false },
      0,
    ],
  ])(
    'desabonne un abonne confirme, annule la sequence drip et %s',
    async (_label, options, accuses) => {
      const result = await desabonner(buildAbonnePersiste(confirme), options);

      expect(result).toEqual(
        expect.objectContaining({
          status: 'unsubscribed',
          alreadyUnsubscribed: false,
        }),
      );
      expect(repo.markUnsubscribed).toHaveBeenCalled();
      expect(scheduler.cancel).toHaveBeenCalledTimes(1);
      expect(mailer.sendUnsubscribeAck).toHaveBeenCalledTimes(accuses);
    },
  );

  it.each([
    [
      'si une requete concurrente a gagne',
      confirme,
      () => repo.markUnsubscribed.mockResolvedValueOnce(null),
    ],
    [
      'quand l’abonne est deja desabonne',
      (abonne: NewsletterSubscriber) => abonne.unsubscribe(),
      () => undefined,
    ],
  ])(
    'ne declenche aucun effet de bord %s',
    async (_label, preparer, course) => {
      course();

      const result = await desabonner(buildAbonnePersiste(preparer));

      expect(result).toEqual(
        expect.objectContaining({
          status: 'unsubscribed',
          alreadyUnsubscribed: true,
        }),
      );
      expect(repo.update).not.toHaveBeenCalled();
      expect(scheduler.cancel).not.toHaveBeenCalled();
      expect(mailer.sendUnsubscribeAck).not.toHaveBeenCalled();
    },
  );

  it('accepte un desabonnement avant confirmation', async () => {
    const result = await desabonner(buildAbonnePersiste());

    expect(result.status).toBe('unsubscribed');
  });

  it('leve ResourceNotFoundError pour un token inconnu', async () => {
    repo.findByUnsubscribeToken.mockResolvedValueOnce(null);
    await expect(
      useCase.execute('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it.each([
    ['scheduler.cancel', () => scheduler.cancel],
    ['sendUnsubscribeAck', () => mailer.sendUnsubscribeAck],
  ])(
    "ne propage pas l'erreur si %s echoue (fire-and-forget)",
    async (_label, effet) => {
      effet().mockRejectedValueOnce(new Error('panne'));

      await expect(
        desabonner(buildAbonnePersiste(confirme)),
      ).resolves.toBeDefined();
      expect(effet()).toHaveBeenCalledTimes(1);
    },
  );
});
