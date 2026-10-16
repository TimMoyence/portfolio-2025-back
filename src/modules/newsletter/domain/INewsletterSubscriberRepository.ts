import type { VerrouParBoite } from '../../../common/domain/verrou-par-boite';
import type { NewsletterSubscriber } from './NewsletterSubscriber';

export interface INewsletterSubscriberRepository extends VerrouParBoite<INewsletterSubscriberRepository> {
  create(subscriber: NewsletterSubscriber): Promise<NewsletterSubscriber>;

  findByEmailAndSource(
    email: string,
    sourceFormationSlug: string,
  ): Promise<NewsletterSubscriber | null>;

  derniereConfirmationVersLaBoiteDe(
    email: string,
  ): Promise<NewsletterSubscriber | null>;

  boiteInscriteA(email: string, sourceFormationSlug: string): Promise<boolean>;

  findByConfirmToken(token: string): Promise<NewsletterSubscriber | null>;

  findByUnsubscribeToken(token: string): Promise<NewsletterSubscriber | null>;

  update(subscriber: NewsletterSubscriber): Promise<NewsletterSubscriber>;

  markUnsubscribed(
    subscriber: NewsletterSubscriber,
  ): Promise<NewsletterSubscriber | null>;
}
