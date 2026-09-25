/* eslint-disable @typescript-eslint/unbound-method */
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import {
  createNewsletterDependances,
  type PreparationDAbonne,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import {
  attendreTokenInconnuRefuse,
  executerSurAbonneTrouve,
} from '../../../../../test/helpers/token-newsletter';
import { ConfirmSubscriptionUseCase } from '../ConfirmSubscription.useCase';

describe('ConfirmSubscriptionUseCase', () => {
  let { repo, mailer, scheduler } = createNewsletterDependances();
  let useCase: ConfirmSubscriptionUseCase;

  beforeEach(() => {
    ({ repo, mailer, scheduler } = createNewsletterDependances());
    useCase = new ConfirmSubscriptionUseCase(repo, mailer, scheduler);
  });

  const confirmer = (preparer?: PreparationDAbonne) =>
    executerSurAbonneTrouve(repo.findByConfirmToken, preparer, (abonne) =>
      useCase.execute(abonne.confirmToken),
    );

  const attendreAucunEffet = () => {
    expect(repo.update).not.toHaveBeenCalled();
    expect(mailer.sendWelcome).not.toHaveBeenCalled();
    expect(scheduler.schedule).not.toHaveBeenCalled();
  };

  it('confirme un abonne pending et declenche welcome + drip', async () => {
    const result = await confirmer();

    expect(result.status).toBe('confirmed');
    expect(result.alreadyConfirmed).toBe(false);
    expect(repo.update).toHaveBeenCalled();
    expect(mailer.sendWelcome).toHaveBeenCalledTimes(1);
    expect(scheduler.schedule).toHaveBeenCalledTimes(1);
  });

  it('est idempotent quand deja confirme — ne renvoie pas welcome', async () => {
    const result = await confirmer((abonne) =>
      abonne.confirm(new Date('2026-04-10T10:00:00Z')),
    );

    expect(result.status).toBe('confirmed');
    expect(result.alreadyConfirmed).toBe(true);
    attendreAucunEffet();
  });

  it('leve ResourceNotFoundError pour un token inconnu', async () => {
    await attendreTokenInconnuRefuse(repo.findByConfirmToken, (token) =>
      useCase.execute(token),
    );
  });

  it.each([
    [
      'ne propage pas l’erreur si sendWelcome echoue (fire-and-forget)',
      () => mailer.sendWelcome.mockRejectedValueOnce(new Error('SMTP down')),
      () => repo.update,
    ],
    [
      "ne propage pas l'erreur si scheduler.schedule echoue (fire-and-forget)",
      () => scheduler.schedule.mockRejectedValueOnce(new Error('BullMQ down')),
      () => scheduler.schedule,
    ],
  ])('%s', async (_titre, faireEchouer, etapeAtteinte) => {
    faireEchouer();

    await expect(confirmer()).resolves.toBeDefined();
    expect(etapeAtteinte()).toHaveBeenCalledTimes(1);
  });

  it('leve DomainValidationError si le subscriber est unsubscribed', async () => {
    await expect(confirmer((abonne) => abonne.unsubscribe())).rejects.toThrow(
      /Cannot confirm an unsubscribed/,
    );
  });

  it('rejette un token expire (> 7j) comme un token inconnu', async () => {
    await expect(
      confirmer((abonne) => {
        abonne.confirmTokenExpiresAt = new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        );
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    attendreAucunEffet();
  });
});
