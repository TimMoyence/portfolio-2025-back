/* eslint-disable @typescript-eslint/unbound-method */
import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import {
  buildNewsletterSubscriber,
  createMockEmailDripScheduler,
  createMockNewsletterMailer,
  createMockNewsletterSubscriberRepo,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import { SubscribeNewsletterUseCase } from '../SubscribeNewsletter.useCase';
import type { SubscribeNewsletterCommand } from '../dto/SubscribeNewsletter.command';

describe('SubscribeNewsletterUseCase', () => {
  const validCommand: SubscribeNewsletterCommand = {
    email: 'marie@example.com',
    firstName: 'Marie',
    locale: 'fr',
    sourceFormationSlug: 'ia-solopreneurs',
    termsVersion: '2026-04-10',
    termsAcceptedAt: new Date('2026-04-10T10:00:00Z'),
  };

  let repo: ReturnType<typeof createMockNewsletterSubscriberRepo>;
  let mailer: ReturnType<typeof createMockNewsletterMailer>;
  let scheduler: ReturnType<typeof createMockEmailDripScheduler>;
  let useCase: SubscribeNewsletterUseCase;

  beforeEach(() => {
    repo = createMockNewsletterSubscriberRepo();
    mailer = createMockNewsletterMailer();
    scheduler = createMockEmailDripScheduler();
    useCase = new SubscribeNewsletterUseCase(repo, mailer, scheduler);
  });

  it('cree un abonne et envoie l\u2019email de confirmation sur un email nouveau', async () => {
    const result = await useCase.execute(validCommand);
    await flushPromises();

    expect(result.created).toBe(true);
    expect(result.alreadySubscribed).toBe(false);
    expect(result.status).toBe('pending');
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1);
  });

  it("renvoie un email de confirmation sans recreer quand l'abonne est deja pending", async () => {
    const existing = buildNewsletterSubscriber();
    existing.id = 'existing-id';
    repo.findByEmailAndSource.mockResolvedValueOnce(existing);

    const result = await useCase.execute(validCommand);
    await flushPromises();

    expect(result.created).toBe(false);
    expect(result.alreadySubscribed).toBe(true);
    expect(result.status).toBe('pending');
    expect(repo.create).not.toHaveBeenCalled();
    expect(mailer.sendConfirmation).toHaveBeenCalledWith(existing);
  });

  it('ne renvoie PAS d\u2019email quand l\u2019abonne est deja confirme', async () => {
    const existing = buildNewsletterSubscriber();
    existing.id = 'existing-id';
    existing.confirm(new Date('2026-04-10T11:00:00Z'));
    repo.findByEmailAndSource.mockResolvedValueOnce(existing);

    const result = await useCase.execute(validCommand);
    await flushPromises();

    expect(result.created).toBe(false);
    expect(result.alreadySubscribed).toBe(true);
    expect(result.status).toBe('confirmed');
    expect(mailer.sendConfirmation).not.toHaveBeenCalled();
  });

  it('ne renvoie PAS d\u2019email quand l\u2019abonne est unsubscribed', async () => {
    const existing = buildNewsletterSubscriber();
    existing.id = 'existing-id';
    existing.unsubscribe();
    repo.findByEmailAndSource.mockResolvedValueOnce(existing);

    const result = await useCase.execute(validCommand);
    await flushPromises();

    expect(result.status).toBe('unsubscribed');
    expect(mailer.sendConfirmation).not.toHaveBeenCalled();
  });

  it('journalise et ne propage pas un echec SMTP', async () => {
    mailer.sendConfirmation.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(useCase.execute(validCommand)).resolves.toEqual({
      created: true,
      alreadySubscribed: false,
      status: 'pending',
    });
    await flushPromises();
    // L'echec fire-and-forget ne doit pas casser la reponse HTTP.
  });

  it('absorbe silencieusement une race condition `ResourceConflictError`', async () => {
    const raced = buildNewsletterSubscriber();
    raced.id = 'raced-id';
    // Premier appel : rien (le check-then-create naif verrait `null`).
    repo.findByEmailAndSource
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(raced);
    repo.create.mockRejectedValueOnce(
      new ResourceConflictError('already exists'),
    );

    const result = await useCase.execute(validCommand);
    await flushPromises();

    expect(result.created).toBe(false);
    expect(result.alreadySubscribed).toBe(true);
    expect(result.status).toBe('pending');
    expect(repo.findByEmailAndSource).toHaveBeenCalledTimes(2);
    expect(mailer.sendConfirmation).toHaveBeenCalledWith(raced);
  });

  it('relance une erreur autre que `ResourceConflictError`', async () => {
    repo.create.mockRejectedValueOnce(new Error('DB down'));
    await expect(useCase.execute(validCommand)).rejects.toThrow('DB down');
  });
});

function flushPromises(): Promise<void> {
  return new Promise<void>((resolve) => setImmediate(resolve));
}
