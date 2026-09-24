import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import type { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import { ActionDAbonne } from './ActionDAbonne';

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

@Injectable()
export class UnsubscribeNewsletterUseCase extends ActionDAbonne {
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
    const updated = await this.repo.markUnsubscribed(subscriber);
    if (!updated) {
      return { status: 'unsubscribed', alreadyUnsubscribed: true };
    }

    this.enArrierePlan(
      this.scheduler.cancel(updated),
      'Newsletter drip cancel failed',
    );
    if (options.sendAck) {
      this.enArrierePlan(
        this.mailer.sendUnsubscribeAck(updated),
        'Newsletter unsubscribe ack email failed',
      );
    }

    return { status: updated.status, alreadyUnsubscribed: false };
  }
}
