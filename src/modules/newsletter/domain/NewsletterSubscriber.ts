import { randomUUID } from 'node:crypto';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { requireText } from '../../../common/domain/validation/domain-validators';
import { EmailAddress } from '../../../common/domain/value-objects/EmailAddress';
import type { SubscriptionStatus } from './SubscriptionStatus';

/**
 * Entree de souscription stockee en base. Invariants domaine :
 * - `email` est valide (EmailAddress value object) et normalise bas.
 * - `sourceFormationSlug` identifie la formation qui a converti le lead
 *   (permet de corriger une sequence drip et d'attribuer la conversion).
 * - `locale` est un code ISO-639 court (fr / en).
 * - Les tokens UUID sont distincts et non-exposes tant que confirmes.
 */
export interface CreateNewsletterSubscriberProps {
  email: string;
  locale: string;
  sourceFormationSlug: string;
  termsVersion: string;
  termsAcceptedAt: Date;
  firstName?: string;
}

/** Entite domaine representant un abonne a la newsletter. */
export class NewsletterSubscriber {
  id?: string;
  email: string;
  firstName: string | null;
  locale: string;
  sourceFormationSlug: string;
  status: SubscriptionStatus;
  confirmToken: string;
  unsubscribeToken: string;
  termsVersion: string;
  termsAcceptedAt: Date;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  createdAt?: Date;

  /**
   * Factory canonique : valide le payload, normalise l'email, genere les
   * tokens UUID et place l'abonne en statut `pending` (double opt-in).
   */
  static create(props: CreateNewsletterSubscriberProps): NewsletterSubscriber {
    const email = EmailAddress.parse(props.email);
    if (!email) {
      throw new DomainValidationError('Invalid newsletter subscriber email');
    }
    const locale = requireText(props.locale, 'locale', 1, 10);
    if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(locale)) {
      throw new DomainValidationError(
        `Invalid locale "${locale}" — expected ISO-639 short code (e.g. fr, en, fr-FR)`,
      );
    }
    const sourceFormationSlug = requireText(
      props.sourceFormationSlug,
      'sourceFormationSlug',
      1,
      100,
    );
    const termsVersion = requireText(props.termsVersion, 'termsVersion', 1, 50);
    if (
      !(props.termsAcceptedAt instanceof Date) ||
      Number.isNaN(props.termsAcceptedAt.getTime())
    ) {
      throw new DomainValidationError('Invalid termsAcceptedAt date');
    }
    const firstName =
      typeof props.firstName === 'string' && props.firstName.trim().length > 0
        ? requireText(props.firstName, 'firstName', 1, 50)
        : null;

    const subscriber = new NewsletterSubscriber();
    subscriber.email = email.value;
    subscriber.firstName = firstName;
    subscriber.locale = locale;
    subscriber.sourceFormationSlug = sourceFormationSlug;
    subscriber.status = 'pending';
    subscriber.confirmToken = randomUUID();
    subscriber.unsubscribeToken = randomUUID();
    subscriber.termsVersion = termsVersion;
    subscriber.termsAcceptedAt = props.termsAcceptedAt;
    subscriber.confirmedAt = null;
    subscriber.unsubscribedAt = null;
    return subscriber;
  }

  /**
   * Confirme l'abonnement via le magic link. Idempotent : rejoue
   * silencieusement quand deja confirme, leve en revanche quand
   * l'abonnement a ete retire.
   */
  confirm(now: Date = new Date()): void {
    if (this.status === 'confirmed') return;
    if (this.status === 'unsubscribed') {
      throw new DomainValidationError(
        'Cannot confirm an unsubscribed newsletter subscription',
      );
    }
    if (this.status === 'bounced') {
      throw new DomainValidationError(
        'Cannot confirm a bounced newsletter subscription',
      );
    }
    this.status = 'confirmed';
    this.confirmedAt = now;
  }

  /**
   * Desabonnement via le lien unsubscribe. Idempotent. Tolere un
   * desabonnement avant confirmation (spam-prevention / changement
   * d'avis utilisateur).
   */
  unsubscribe(now: Date = new Date()): void {
    if (this.status === 'unsubscribed') return;
    this.status = 'unsubscribed';
    this.unsubscribedAt = now;
  }

  /** Passe l'abonnement en `bounced` quand l'email a rebondi cote SMTP. */
  markAsBounced(): void {
    this.status = 'bounced';
  }
}
