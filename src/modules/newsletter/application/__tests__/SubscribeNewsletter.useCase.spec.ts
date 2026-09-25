/* eslint-disable @typescript-eslint/unbound-method */
import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import {
  buildAbonnePersiste,
  buildSubscribeNewsletterCommand,
  createMockNewsletterMailer,
  createMockNewsletterSubscriberRepo,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import { flushPromises } from '../../../../../test/helpers/flush-promises';
import type { NewsletterSubscriber } from '../../domain/NewsletterSubscriber';
import { SubscribeNewsletterUseCase } from '../SubscribeNewsletter.useCase';
import type { SubscribeNewsletterCommand } from '../dto/SubscribeNewsletter.command';

const MINUTE_MS = 60 * 1000;

describe('SubscribeNewsletterUseCase', () => {
  const validCommand: SubscribeNewsletterCommand =
    buildSubscribeNewsletterCommand();

  const CREE_EN_ATTENTE = {
    created: true,
    alreadySubscribed: false,
    status: 'pending',
  };

  const DEJA_EN_ATTENTE = {
    created: false,
    alreadySubscribed: true,
    status: 'pending',
  };

  let repo: ReturnType<typeof createMockNewsletterSubscriberRepo>;
  let mailer: ReturnType<typeof createMockNewsletterMailer>;
  let useCase: SubscribeNewsletterUseCase;

  const souscrire = async () => {
    const result = await useCase.execute(validCommand);
    await flushPromises();
    return result;
  };

  const souscrireSurUnAbonne = async (
    preparer?: (abonne: NewsletterSubscriber) => void,
  ) => {
    const existing = buildAbonnePersiste(preparer);
    repo.findByEmailAndSource.mockResolvedValueOnce(existing);
    return { existing, result: await souscrire() };
  };

  beforeEach(() => {
    repo = createMockNewsletterSubscriberRepo();
    mailer = createMockNewsletterMailer();
    useCase = new SubscribeNewsletterUseCase(repo, mailer);
  });

  it('cree un abonne et envoie l’email de confirmation sur un email nouveau', async () => {
    const result = await souscrire();

    expect(result).toEqual(CREE_EN_ATTENTE);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1);
  });

  it("renvoie un email de confirmation sans recreer quand l'abonne est deja pending", async () => {
    const { existing, result } = await souscrireSurUnAbonne();

    expect(result).toEqual(DEJA_EN_ATTENTE);
    expect(repo.create).not.toHaveBeenCalled();
    expect(mailer.sendConfirmation).toHaveBeenCalledWith(existing);
  });

  it.each([
    [
      'confirme',
      'confirmed',
      (abonne: NewsletterSubscriber) =>
        abonne.confirm(new Date('2026-04-10T11:00:00Z')),
    ],
    [
      'unsubscribed',
      'unsubscribed',
      (abonne: NewsletterSubscriber) => abonne.unsubscribe(),
    ],
  ])(
    'ne renvoie PAS d’email quand l’abonne est deja %s',
    async (_label, status, preparer) => {
      const { result } = await souscrireSurUnAbonne(preparer);

      expect(result).toEqual({ ...DEJA_EN_ATTENTE, status });
      expect(mailer.sendConfirmation).not.toHaveBeenCalled();
    },
  );

  it('journalise et ne propage pas un echec SMTP', async () => {
    mailer.sendConfirmation.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(souscrire()).resolves.toEqual(CREE_EN_ATTENTE);
  });

  it('absorbe une race condition `ResourceConflictError`', async () => {
    const raced = buildAbonnePersiste();
    repo.findByEmailAndSource
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(raced);
    repo.create.mockRejectedValueOnce(
      new ResourceConflictError('already exists'),
    );

    const result = await souscrire();

    expect(result).toEqual(DEJA_EN_ATTENTE);
    expect(repo.findByEmailAndSource).toHaveBeenCalledTimes(2);
    expect(mailer.sendConfirmation).toHaveBeenCalledWith(raced);
  });

  it('relance une erreur autre que `ResourceConflictError`', async () => {
    repo.create.mockRejectedValueOnce(new Error('DB down'));
    await expect(useCase.execute(validCommand)).rejects.toThrow('DB down');
  });

  it.each([
    ['ne renvoie pas', 2, 0],
    ['renvoie', 15, 1],
  ])(
    '%s l’email a un pending re-souscrit %i min apres le dernier envoi (cooldown 10 min)',
    async (_label, minutes, envois) => {
      const { result } = await souscrireSurUnAbonne((abonne) =>
        abonne.markConfirmationSent(new Date(Date.now() - minutes * MINUTE_MS)),
      );

      expect(result.alreadySubscribed).toBe(true);
      expect(mailer.sendConfirmation).toHaveBeenCalledTimes(envois);
    },
  );

  it('fait tourner le confirmToken quand il est expire avant de renvoyer', async () => {
    let previousToken = '';
    const { existing } = await souscrireSurUnAbonne((abonne) => {
      abonne.confirmTokenExpiresAt = new Date(Date.now() - 24 * 60 * MINUTE_MS);
      previousToken = abonne.confirmToken;
    });

    expect(existing.confirmToken).not.toBe(previousToken);
    expect(existing.confirmTokenExpiresAt.getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(repo.update).toHaveBeenCalled();
  });

  it('persiste `lastConfirmationSentAt` apres un envoi (audit + cooldown)', async () => {
    const { existing } = await souscrireSurUnAbonne((abonne) =>
      expect(abonne.lastConfirmationSentAt).toBeNull(),
    );

    expect(existing.lastConfirmationSentAt).not.toBeNull();
    expect(repo.update).toHaveBeenCalledWith(existing);
  });

  it('respecte le padding de reponse minimum (anti timing-attack)', async () => {
    const MIN_RESPONSE_MS = 300;
    const CLOCK_ROUNDING_TOLERANCE_MS = 5;

    const start = Date.now();
    await useCase.execute(validCommand);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(
      MIN_RESPONSE_MS - CLOCK_ROUNDING_TOLERANCE_MS,
    );
  });
});
