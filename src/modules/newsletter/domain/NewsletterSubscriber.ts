import { randomUUID } from 'node:crypto';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { requireText } from '../../../common/domain/validation/domain-validators';
import { EmailAddress } from '../../../common/domain/value-objects/EmailAddress';
import type { SubscriptionStatus } from './SubscriptionStatus';

export interface CreateNewsletterSubscriberProps {
  email: string;
  locale: string;
  sourceFormationSlug: string;
  termsVersion: string;
  termsAcceptedAt: Date;
  firstName?: string;
}

const CONFIRM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const CONFIRMATION_RESEND_COOLDOWN_MS = 10 * 60 * 1000;

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

  isConfirmTokenExpired(now: Date = new Date()): boolean {
    return now.getTime() > this.confirmTokenExpiresAt.getTime();
  }

  canResendConfirmation(now: Date = new Date()): boolean {
    if (this.lastConfirmationSentAt === null) return true;
    const elapsed = now.getTime() - this.lastConfirmationSentAt.getTime();
    return elapsed >= CONFIRMATION_RESEND_COOLDOWN_MS;
  }

  rotateConfirmToken(now: Date = new Date()): void {
    this.confirmToken = randomUUID();
    this.confirmTokenExpiresAt = new Date(now.getTime() + CONFIRM_TOKEN_TTL_MS);
  }

  markConfirmationSent(now: Date = new Date()): void {
    this.lastConfirmationSentAt = now;
  }

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

  unsubscribe(now: Date = new Date()): void {
    if (this.status === 'unsubscribed') return;
    this.status = 'unsubscribed';
    this.unsubscribedAt = now;
  }

  markAsBounced(): void {
    this.status = 'bounced';
  }
}
