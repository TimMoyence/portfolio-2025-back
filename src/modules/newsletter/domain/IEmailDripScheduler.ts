import type { NewsletterSubscriber } from './NewsletterSubscriber';

export interface IEmailDripScheduler {
  schedule(subscriber: NewsletterSubscriber): Promise<void>;

  cancel(subscriber: NewsletterSubscriber): Promise<void>;
}
