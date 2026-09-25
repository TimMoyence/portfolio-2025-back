/* eslint-disable @typescript-eslint/unbound-method */
import {
  createNewsletterDependances,
  type PreparationDAbonne,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import {
  attendreTokenInconnuRefuse,
  executerSurAbonneTrouve,
} from '../../../../../test/helpers/token-newsletter';
import { UnsubscribeNewsletterUseCase } from '../UnsubscribeNewsletter.useCase';

const confirme: PreparationDAbonne = (abonne) => abonne.confirm();
const dejaDesabonne: PreparationDAbonne = (abonne) => abonne.unsubscribe();

describe('UnsubscribeNewsletterUseCase', () => {
  let { repo, mailer, scheduler } = createNewsletterDependances();
  let useCase: UnsubscribeNewsletterUseCase;

  const desabonner = (
    preparer?: PreparationDAbonne,
    options?: { sendAck: boolean },
  ) =>
    executerSurAbonneTrouve(repo.findByUnsubscribeToken, preparer, (abonne) =>
      useCase.execute(abonne.unsubscribeToken, options),
    );

  beforeEach(() => {
    ({ repo, mailer, scheduler } = createNewsletterDependances());
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
      const result = await desabonner(confirme, options);

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
    ['quand l’abonne est deja desabonne', dejaDesabonne, () => undefined],
  ])(
    'ne declenche aucun effet de bord %s',
    async (_label, preparer, course) => {
      course();

      const result = await desabonner(preparer);

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
    const result = await desabonner();

    expect(result.status).toBe('unsubscribed');
  });

  it('leve ResourceNotFoundError pour un token inconnu', async () => {
    await attendreTokenInconnuRefuse(repo.findByUnsubscribeToken, (token) =>
      useCase.execute(token),
    );
  });

  it.each([
    ['scheduler.cancel', () => scheduler.cancel],
    ['sendUnsubscribeAck', () => mailer.sendUnsubscribeAck],
  ])(
    "ne propage pas l'erreur si %s echoue (fire-and-forget)",
    async (_label, effet) => {
      effet().mockRejectedValueOnce(new Error('panne'));

      await expect(desabonner(confirme)).resolves.toBeDefined();
      expect(effet()).toHaveBeenCalledTimes(1);
    },
  );
});
