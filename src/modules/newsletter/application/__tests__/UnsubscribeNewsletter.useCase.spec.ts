/* eslint-disable @typescript-eslint/unbound-method */
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import {
  buildNewsletterSubscriber,
  createMockEmailDripScheduler,
  createMockNewsletterMailer,
  createMockNewsletterSubscriberRepo,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import { UnsubscribeNewsletterUseCase } from '../UnsubscribeNewsletter.useCase';

describe('UnsubscribeNewsletterUseCase', () => {
  let repo: ReturnType<typeof createMockNewsletterSubscriberRepo>;
  let mailer: ReturnType<typeof createMockNewsletterMailer>;
  let scheduler: ReturnType<typeof createMockEmailDripScheduler>;
  let useCase: UnsubscribeNewsletterUseCase;

  beforeEach(() => {
    repo = createMockNewsletterSubscriberRepo();
    mailer = createMockNewsletterMailer();
    scheduler = createMockEmailDripScheduler();
    useCase = new UnsubscribeNewsletterUseCase(repo, mailer, scheduler);
  });

  it('desabonne un abonne confirmed et annule la sequence drip', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = 'sub-id';
    subscriber.confirm();
    repo.findByUnsubscribeToken.mockResolvedValueOnce(subscriber);
    repo.update.mockImplementationOnce((s) => Promise.resolve(s));

    const result = await useCase.execute(subscriber.unsubscribeToken);
    await flushPromises();

    expect(result.status).toBe('unsubscribed');
    expect(result.alreadyUnsubscribed).toBe(false);
    expect(repo.update).toHaveBeenCalled();
    expect(scheduler.cancel).toHaveBeenCalledTimes(1);
    expect(mailer.sendUnsubscribeAck).toHaveBeenCalledTimes(1);
  });

  it('est idempotent quand deja desabonne', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = 'sub-id';
    subscriber.unsubscribe();
    repo.findByUnsubscribeToken.mockResolvedValueOnce(subscriber);

    const result = await useCase.execute(subscriber.unsubscribeToken);
    await flushPromises();

    expect(result.alreadyUnsubscribed).toBe(true);
    expect(repo.update).not.toHaveBeenCalled();
    expect(scheduler.cancel).not.toHaveBeenCalled();
    expect(mailer.sendUnsubscribeAck).not.toHaveBeenCalled();
  });

  it('accepte un desabonnement avant confirmation', async () => {
    const subscriber = buildNewsletterSubscriber();
    subscriber.id = 'sub-id';
    repo.findByUnsubscribeToken.mockResolvedValueOnce(subscriber);
    repo.update.mockImplementationOnce((s) => Promise.resolve(s));

    const result = await useCase.execute(subscriber.unsubscribeToken);
    await flushPromises();

    expect(result.status).toBe('unsubscribed');
  });

  it('leve ResourceNotFoundError pour un token inconnu', async () => {
    repo.findByUnsubscribeToken.mockResolvedValueOnce(null);
    await expect(
      useCase.execute('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

function flushPromises(): Promise<void> {
  return new Promise<void>((resolve) => setImmediate(resolve));
}
