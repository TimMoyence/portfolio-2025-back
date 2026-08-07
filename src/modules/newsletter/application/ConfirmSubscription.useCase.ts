import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import type { IEmailDripScheduler } from '../domain/IEmailDripScheduler';
import type { INewsletterMailer } from '../domain/INewsletterMailer';
import type { INewsletterSubscriberRepository } from '../domain/INewsletterSubscriberRepository';
import type { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import {
  EMAIL_DRIP_SCHEDULER,
  NEWSLETTER_MAILER,
  NEWSLETTER_SUBSCRIBER_REPOSITORY,
} from '../domain/token';

export interface ConfirmSubscriptionResult {
  readonly status: NewsletterSubscriber['status'];
  readonly alreadyConfirmed: boolean;
}

@Injectable()
export class ConfirmSubscriptionUseCase {
  private readonly logger = new Logger(ConfirmSubscriptionUseCase.name);

  constructor(
    @Inject(NEWSLETTER_SUBSCRIBER_REPOSITORY)
    private readonly repo: INewsletterSubscriberRepository,
    @Inject(NEWSLETTER_MAILER)
    private readonly mailer: INewsletterMailer,
    @Inject(EMAIL_DRIP_SCHEDULER)
    private readonly scheduler: IEmailDripScheduler,
  ) {}

  async execute(confirmToken: string): Promise<ConfirmSubscriptionResult> {
    const subscriber = await this.repo.findByConfirmToken(confirmToken);
    if (!subscriber) {
      throw new ResourceNotFoundError('Invalid or expired confirm token');
    }

    if (subscriber.status === 'confirmed') {
      return { status: 'confirmed', alreadyConfirmed: true };
    }

    // E-SEC-4 : un token valide mais expire (> 7j) n'est plus activable.
    // Reponse identique a "token inconnu" pour ne pas reveler l'etat via
    // 404 vs 410. Le subscriber pending peut redemander un nouveau lien
    // par re-souscription.
    if (subscriber.isConfirmTokenExpired()) {
      throw new ResourceNotFoundError('Invalid or expired confirm token');
    }

    subscriber.confirm();
    const updated = await this.repo.update(subscriber);

    void this.mailer
      .sendWelcome(updated)
      .catch((err: unknown) =>
        this.logger.warn('Newsletter welcome email failed', err),
      );
    void this.scheduler
      .schedule(updated)
      .catch((err: unknown) =>
        this.logger.warn('Newsletter drip schedule failed', err),
      );

    return { status: updated.status, alreadyConfirmed: false };
  }
}
