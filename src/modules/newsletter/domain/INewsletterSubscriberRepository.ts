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

  /**
   * Persiste les mutations d'etat et de cycle de vie du subscriber.
   *
   * Champs effectivement sauves (scope volontairement restreint aux
   * transitions gerees par le domaine) :
   *  - `status` (pending | confirmed | unsubscribed | bounced)
   *  - `confirmToken` (rotation apres expiration)
   *  - `confirmTokenExpiresAt` (renouvellement TTL 7j)
   *  - `lastConfirmationSentAt` (cooldown anti mail-bombing)
   *  - `confirmedAt`
   *  - `unsubscribedAt`
   *
   * Champs **non** touches : `email`, `firstName`, `locale`,
   * `sourceFormationSlug`, `termsVersion`, `termsAcceptedAt`. Un futur
   * besoin "update profile" (RGPD rectification, changement de locale)
   * devra introduire une methode dediee (`updateProfile`) pour rester
   * explicite et eviter les mutations silencieuses.
   */
  update(subscriber: NewsletterSubscriber): Promise<NewsletterSubscriber>;
}
