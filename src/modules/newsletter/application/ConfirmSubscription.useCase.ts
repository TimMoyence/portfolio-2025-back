import { Injectable } from '@nestjs/common';
import { enArrierePlan } from '../../../common/application/en-arriere-plan';
import { LienInvalideError } from '../../../common/domain/errors/LienInvalideError';
import type { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import { ActionDAbonne } from './ActionDAbonne';

export interface ConfirmSubscriptionResult {
  readonly status: NewsletterSubscriber['status'];
  readonly alreadyConfirmed: boolean;
}

@Injectable()
export class ConfirmSubscriptionUseCase extends ActionDAbonne {
  async execute(confirmToken: string): Promise<ConfirmSubscriptionResult> {
    const subscriber = await this.abonneDuLien(
      this.repo.findByConfirmToken(confirmToken),
    );

    if (subscriber.status === 'confirmed') {
      return { status: 'confirmed', alreadyConfirmed: true };
    }

    // Meme erreur qu'un token inconnu : opposer 404 et 410 (RFC 9110)
    // revelerait qu'un token a existe pour cette souscription.
    if (subscriber.isConfirmTokenExpired()) {
      throw new LienInvalideError();
    }

    subscriber.confirm();
    const updated = await this.repo.update(subscriber);

    enArrierePlan(
      this.mailer.sendWelcome(updated),
      'Newsletter welcome email failed',
      this.logger,
    );
    enArrierePlan(
      this.scheduler.schedule(updated),
      'Newsletter drip schedule failed',
      this.logger,
    );

    return { status: updated.status, alreadyConfirmed: false };
  }
}
