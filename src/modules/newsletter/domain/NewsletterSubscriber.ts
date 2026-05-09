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

/** TTL du magic link de confirmation en millisecondes (7 jours). */
export const CONFIRM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cooldown minimum entre deux envois de confirmation pour un meme
 * subscriber `pending`. Empeche le mail-bombing d'une boite tiers via
 * re-souscriptions repetees (E-SEC-14).
 */
export const CONFIRMATION_RESEND_COOLDOWN_MS = 10 * 60 * 1000;

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
  confirmTokenExpiresAt: Date;
  lastConfirmationSentAt: Date | null;
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
    subscriber.confirmTokenExpiresAt = new Date(
      props.termsAcceptedAt.getTime() + CONFIRM_TOKEN_TTL_MS,
    );
    subscriber.lastConfirmationSentAt = null;
    subscriber.confirmedAt = null;
    subscriber.unsubscribedAt = null;
    return subscriber;
  }

  /**
   * Indique si le token de confirmation est expire a l'instant `now`.
   * Renvoie `false` pour les subscribers `confirmed`/`unsubscribed` car
   * le token n'est plus consomable de toute facon.
   */
  isConfirmTokenExpired(now: Date = new Date()): boolean {
    return now.getTime() > this.confirmTokenExpiresAt.getTime();
  }

  /**
   * Retourne `true` si un nouvel email de confirmation peut etre envoye
   * a l'instant `now`. Applique un cooldown de 10 minutes depuis le
   * dernier envoi pour empecher le mail-bombing (E-SEC-14).
   */
  canResendConfirmation(now: Date = new Date()): boolean {
    if (this.lastConfirmationSentAt === null) return true;
    const elapsed = now.getTime() - this.lastConfirmationSentAt.getTime();
    return elapsed >= CONFIRMATION_RESEND_COOLDOWN_MS;
  }

  /**
   * Fait tourner le magic link : genere un nouveau `confirmToken`, reset
   * son expiration et efface `lastConfirmationSentAt`. Appele quand le
   * token est expire et qu'un nouvel email est redemande — le caller
   * reste responsable d'appeler `markConfirmationSent(now)` apres
   * l'envoi SMTP reussi.
   */
  rotateConfirmToken(now: Date = new Date()): void {
    this.confirmToken = randomUUID();
    this.confirmTokenExpiresAt = new Date(now.getTime() + CONFIRM_TOKEN_TTL_MS);
  }

  /** Tamponne l'envoi de l'email de confirmation (cooldown + audit). */
  markConfirmationSent(now: Date = new Date()): void {
    this.lastConfirmationSentAt = now;
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
