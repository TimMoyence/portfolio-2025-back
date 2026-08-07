import type { NewsletterSubscriber } from './NewsletterSubscriber';

export interface INewsletterSubscriberRepository {
  create(subscriber: NewsletterSubscriber): Promise<NewsletterSubscriber>;

  findByEmailAndSource(
    email: string,
    sourceFormationSlug: string,
  ): Promise<NewsletterSubscriber | null>;

  findByConfirmToken(token: string): Promise<NewsletterSubscriber | null>;

  findByUnsubscribeToken(token: string): Promise<NewsletterSubscriber | null>;

  update(subscriber: NewsletterSubscriber): Promise<NewsletterSubscriber>;

  markUnsubscribed(
    subscriber: NewsletterSubscriber,
  ): Promise<NewsletterSubscriber | null>;
}
