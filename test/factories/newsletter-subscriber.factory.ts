import { NewsletterSubscriber } from '../../src/modules/newsletter/domain/NewsletterSubscriber';
import type { IEmailDripScheduler } from '../../src/modules/newsletter/domain/IEmailDripScheduler';
import type { INewsletterMailer } from '../../src/modules/newsletter/domain/INewsletterMailer';
import type { INewsletterSubscriberRepository } from '../../src/modules/newsletter/domain/INewsletterSubscriberRepository';

export function buildNewsletterSubscriber(
  overrides?: Partial<NewsletterSubscriber>,
): NewsletterSubscriber {
  const subscriber = NewsletterSubscriber.create({
    email: 'marie@example.com',
    firstName: 'Marie',
    locale: 'fr',
    sourceFormationSlug: 'ia-solopreneurs',
    termsVersion: '2026-04-10',
    termsAcceptedAt: new Date(),
  });
  Object.assign(subscriber, overrides ?? {});
  return subscriber;
}

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
    markUnsubscribed: jest
      .fn()
      .mockImplementation((s: NewsletterSubscriber) => Promise.resolve(s)),
  };
}

export function createMockNewsletterMailer(): jest.Mocked<INewsletterMailer> {
  return {
    sendConfirmation: jest.fn().mockResolvedValue(undefined),
    sendWelcome: jest.fn().mockResolvedValue(undefined),
    sendUnsubscribeAck: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockEmailDripScheduler(): jest.Mocked<IEmailDripScheduler> {
  return {
    schedule: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
  };
}
