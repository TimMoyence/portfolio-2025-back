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

/**
 * Use-case declenche lors du clic sur le magic link de l'email de
 * confirmation. Idempotent : rejouer le meme token apres confirmation
 * ne declenche ni nouvelle mutation ni nouvel email de bienvenue.
 *
 * Effet de bord cle : planifie la sequence drip apres confirmation
 * effective (jamais avant — on evite d'ecrire aux adresses douteuses).
 */
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

    subscriber.confirm();
    const updated = await this.repo.update(subscriber);

    // Fire-and-forget : la confirmation est valide meme si l'un des
    // side-effects (welcome email, drip scheduling) echoue a chaud.
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
