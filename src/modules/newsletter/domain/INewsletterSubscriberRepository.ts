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

  /**
   * Transition atomique vers `unsubscribed`, conditionnee au statut en
   * base plutot qu'a une lecture prealable.
   *
   * Deux desabonnements concurrents lisent tous deux un abonne encore
   * actif, franchissent tous deux la garde applicative et declenchent
   * tous deux les effets de bord — dont l'email d'accuse, envoye en
   * double. Le rejeu automatique du one-click rend ce cas realiste.
   *
   * Retourne `null` lorsque aucune ligne n'a ete affectee, c'est-a-dire
   * lorsqu'une requete concurrente a deja opere la transition : l'appelant
   * sait alors qu'il ne doit declencher aucun effet de bord.
   */
  markUnsubscribed(
    subscriber: NewsletterSubscriber,
  ): Promise<NewsletterSubscriber | null>;
}
