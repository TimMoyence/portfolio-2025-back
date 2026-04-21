import type { NewsletterSubscriber } from './NewsletterSubscriber';

/**
 * Port de persistance du bounded context Newsletter. L'implementation
 * TypeORM vit dans `infrastructure/` ; tout autre module reste decouple
 * du moteur de stockage.
 */
export interface INewsletterSubscriberRepository {
  /** Cree un nouvel abonne. Echoue si l'email+source existe deja. */
  create(subscriber: NewsletterSubscriber): Promise<NewsletterSubscriber>;

  /** Recherche par email + formation source (unicite metier). */
  findByEmailAndSource(
    email: string,
    sourceFormationSlug: string,
  ): Promise<NewsletterSubscriber | null>;

  /** Recherche par confirm token — utilise pour l'endpoint `/confirm`. */
  findByConfirmToken(token: string): Promise<NewsletterSubscriber | null>;

  /** Recherche par unsubscribe token — endpoint `/unsubscribe`. */
  findByUnsubscribeToken(token: string): Promise<NewsletterSubscriber | null>;

  /** Persiste un changement d'etat (confirm / unsubscribe / bounced). */
  update(subscriber: NewsletterSubscriber): Promise<NewsletterSubscriber>;
}
