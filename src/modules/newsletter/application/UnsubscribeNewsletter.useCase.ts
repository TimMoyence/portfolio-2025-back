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

export interface UnsubscribeNewsletterOptions {
  /**
   * Envoi de l'accuse de desabonnement. A desactiver sur le chemin
   * one-click (RFC 8058) : repondre par un email a quelqu'un qui vient
   * de cliquer « Se desabonner » dans son client mail est un motif
   * classique de plainte pour spam.
   */
  readonly sendAck: boolean;
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
    options: UnsubscribeNewsletterOptions = { sendAck: true },
  ): Promise<UnsubscribeNewsletterResult> {
    const subscriber = await this.repo.findByUnsubscribeToken(unsubscribeToken);
    if (!subscriber) {
      throw new ResourceNotFoundError('Invalid or expired unsubscribe token');
    }

    if (subscriber.status === 'unsubscribed') {
      return { status: 'unsubscribed', alreadyUnsubscribed: true };
    }

    subscriber.unsubscribe();
    // Transition conditionnee au statut en base : sans cela, deux
    // desabonnements concurrents franchissent tous deux la garde
    // ci-dessus et declenchent chacun les effets de bord.
    const updated = await this.repo.markUnsubscribed(subscriber);
    if (!updated) {
      return { status: 'unsubscribed', alreadyUnsubscribed: true };
    }

    void this.scheduler
      .cancel(updated)
      .catch((err: unknown) =>
        this.logger.warn('Newsletter drip cancel failed', err),
      );
    if (options.sendAck) {
      void this.mailer
        .sendUnsubscribeAck(updated)
        .catch((err: unknown) =>
          this.logger.warn('Newsletter unsubscribe ack email failed', err),
        );
    }

    return { status: updated.status, alreadyUnsubscribed: false };
  }
}
