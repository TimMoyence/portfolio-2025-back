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

export interface UnsubscribeNewsletterResult {
  readonly status: NewsletterSubscriber['status'];
  readonly alreadyUnsubscribed: boolean;
}

/**
 * Retrait d'abonnement via le token unsubscribe (lien pied d'email).
 * Idempotent et sans friction : le desabonnement doit etre instantane
 * pour se conformer au RGPD et a la loi CAN-SPAM.
 */
@Injectable()
export class UnsubscribeNewsletterUseCase {
  private readonly logger = new Logger(UnsubscribeNewsletterUseCase.name);

  constructor(
    @Inject(NEWSLETTER_SUBSCRIBER_REPOSITORY)
    private readonly repo: INewsletterSubscriberRepository,
    @Inject(NEWSLETTER_MAILER)
    private readonly mailer: INewsletterMailer,
    @Inject(EMAIL_DRIP_SCHEDULER)
    private readonly scheduler: IEmailDripScheduler,
  ) {}

  async execute(
    unsubscribeToken: string,
  ): Promise<UnsubscribeNewsletterResult> {
    const subscriber = await this.repo.findByUnsubscribeToken(unsubscribeToken);
    if (!subscriber) {
      throw new ResourceNotFoundError('Invalid or expired unsubscribe token');
    }

    if (subscriber.status === 'unsubscribed') {
      return { status: 'unsubscribed', alreadyUnsubscribed: true };
    }

    subscriber.unsubscribe();
    const updated = await this.repo.update(subscriber);

    void this.scheduler
      .cancel(updated)
      .catch((err: unknown) =>
        this.logger.warn('Newsletter drip cancel failed', err),
      );
    void this.mailer
      .sendUnsubscribeAck(updated)
      .catch((err: unknown) =>
        this.logger.warn('Newsletter unsubscribe ack email failed', err),
      );

    return { status: updated.status, alreadyUnsubscribed: false };
  }
}
