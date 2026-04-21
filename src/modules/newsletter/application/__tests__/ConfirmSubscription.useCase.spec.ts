/* eslint-disable @typescript-eslint/unbound-method */
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import {
  buildNewsletterSubscriber,
  createMockEmailDripScheduler,
  createMockNewsletterMailer,
  createMockNewsletterSubscriberRepo,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import { ConfirmSubscriptionUseCase } from '../ConfirmSubscription.useCase';

describe('ConfirmSubscriptionUseCase', () => {
  let repo: ReturnType<typeof createMockNewsletterSubscriberRepo>;
  let mailer: ReturnType<typeof createMockNewsletterMailer>;
  let scheduler: ReturnType<typeof createMockEmailDripScheduler>;
  let useCase: ConfirmSubscriptionUseCase;

  beforeEach(() => {
    repo = createMockNewsletterSubscriberRepo();
    mailer = createMockNewsletterMailer();
    scheduler = createMockEmailDripScheduler();
    useCase = new ConfirmSubscriptionUseCase(repo, mailer, scheduler);
  });

  it('confirme un abonne pending et declenche welcome + drip', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = 'sub-id';
    repo.findByConfirmToken.mockResolvedValueOnce(subscriber);
    repo.update.mockImplementationOnce((s) => Promise.resolve(s));

    const result = await useCase.execute(subscriber.confirmToken);
    await flushPromises();

    expect(result.status).toBe('confirmed');
    expect(result.alreadyConfirmed).toBe(false);
    expect(repo.update).toHaveBeenCalled();
    expect(mailer.sendWelcome).toHaveBeenCalledTimes(1);
    expect(scheduler.schedule).toHaveBeenCalledTimes(1);
  });

  it('est idempotent quand deja confirme — ne renvoie pas welcome', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = 'sub-id';
    subscriber.confirm(new Date('2026-04-10T10:00:00Z'));
    repo.findByConfirmToken.mockResolvedValueOnce(subscriber);

    const result = await useCase.execute(subscriber.confirmToken);
    await flushPromises();

    expect(result.status).toBe('confirmed');
    expect(result.alreadyConfirmed).toBe(true);
    expect(repo.update).not.toHaveBeenCalled();
    expect(mailer.sendWelcome).not.toHaveBeenCalled();
    expect(scheduler.schedule).not.toHaveBeenCalled();
  });

  it('leve ResourceNotFoundError pour un token inconnu', async () => {
    repo.findByConfirmToken.mockResolvedValueOnce(null);
    await expect(
      useCase.execute('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('leve DomainValidationError si le subscriber est unsubscribed', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = 'sub-id';
    subscriber.unsubscribe();
    repo.findByConfirmToken.mockResolvedValueOnce(subscriber);

    await expect(useCase.execute(subscriber.confirmToken)).rejects.toThrow(
      /Cannot confirm an unsubscribed/,
    );
  });
});

function flushPromises(): Promise<void> {
  return new Promise<void>((resolve) => setImmediate(resolve));
}
