import type { NewsletterSubscriber } from './NewsletterSubscriber';

export interface INewsletterMailer {
  sendConfirmation(subscriber: NewsletterSubscriber): Promise<void>;
  sendWelcome(subscriber: NewsletterSubscriber): Promise<void>;
  sendUnsubscribeAck(subscriber: NewsletterSubscriber): Promise<void>;
}
