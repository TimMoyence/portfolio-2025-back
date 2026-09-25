import { Injectable } from '@nestjs/common';
import type { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import { ActionDAbonne } from './ActionDAbonne';

export interface ConfirmSubscriptionResult {
  readonly status: NewsletterSubscriber['status'];
  readonly alreadyConfirmed: boolean;
}

@Injectable()
export class ConfirmSubscriptionUseCase extends ActionDAbonne {
  async execute(confirmToken: string): Promise<ConfirmSubscriptionResult> {
    const subscriber = await this.repo.findByConfirmToken(confirmToken);
    if (!subscriber) {
      throw this.jetonInvalide('confirm');
    }

    if (subscriber.status === 'confirmed') {
      return { status: 'confirmed', alreadyConfirmed: true };
    }

    // Meme erreur qu'un token inconnu : opposer 404 et 410 (RFC 9110)
    // revelerait qu'un token a existe pour cette souscription.
    if (subscriber.isConfirmTokenExpired()) {
      throw this.jetonInvalide('confirm');
    }

    subscriber.confirm();
    const updated = await this.repo.update(subscriber);

    this.enArrierePlan(
      this.mailer.sendWelcome(updated),
      'Newsletter welcome email failed',
    );
    this.enArrierePlan(
      this.scheduler.schedule(updated),
      'Newsletter drip schedule failed',
    );

    return { status: updated.status, alreadyConfirmed: false };
  }
}
