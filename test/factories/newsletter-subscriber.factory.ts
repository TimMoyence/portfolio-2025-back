import { NewsletterSubscriber } from '../../src/modules/newsletter/domain/NewsletterSubscriber';
import type { IEmailDripScheduler } from '../../src/modules/newsletter/domain/IEmailDripScheduler';
import type { INewsletterMailer } from '../../src/modules/newsletter/domain/INewsletterMailer';
import type { INewsletterSubscriberRepository } from '../../src/modules/newsletter/domain/INewsletterSubscriberRepository';

/**
 * Construit un abonne newsletter valide. Les overrides permettent de
 * personnaliser n'importe quel champ sans dupliquer la creation.
 */
export function buildNewsletterSubscriber(
  overrides?: Partial<NewsletterSubscriber>,
): NewsletterSubscriber {
  const subscriber = NewsletterSubscriber.create({
    email: 'marie@example.com',
    firstName: 'Marie',
    locale: 'fr',
    sourceFormationSlug: 'ia-solopreneurs',
    termsVersion: '2026-04-10',
    termsAcceptedAt: new Date('2026-04-10T10:00:00Z'),
  });
  Object.assign(subscriber, overrides ?? {});
  return subscriber;
}

/**
 * Mock du repository avec les 4 operations attendues. Retourne le
 * pattern jest.Mocked strict — Jest TypeScript garantit que chaque
 * methode est bien une `jest.fn()` exploitant les types d'arguments.
 */
export function createMockNewsletterSubscriberRepo(): jest.Mocked<INewsletterSubscriberRepository> {
  const persisted = buildNewsletterSubscriber();
  persisted.id = 'subscriber-uuid';
  return {
    create: jest.fn().mockResolvedValue(persisted),
    findByEmailAndSource: jest.fn().mockResolvedValue(null),
    findByConfirmToken: jest.fn().mockResolvedValue(persisted),
    findByUnsubscribeToken: jest.fn().mockResolvedValue(persisted),
    update: jest
      .fn()
      .mockImplementation((s: NewsletterSubscriber) => Promise.resolve(s)),
  };
}

/** Mock du port `INewsletterMailer`. */
export function createMockNewsletterMailer(): jest.Mocked<INewsletterMailer> {
  return {
    sendConfirmation: jest.fn().mockResolvedValue(undefined),
    sendWelcome: jest.fn().mockResolvedValue(undefined),
    sendUnsubscribeAck: jest.fn().mockResolvedValue(undefined),
  };
}

/** Mock du port `IEmailDripScheduler`. */
export function createMockEmailDripScheduler(): jest.Mocked<IEmailDripScheduler> {
  return {
    schedule: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
  };
}
