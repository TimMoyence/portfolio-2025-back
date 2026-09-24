import { Inject, Logger } from '@nestjs/common';
import type { IEmailDripScheduler } from '../domain/IEmailDripScheduler';
import type { INewsletterMailer } from '../domain/INewsletterMailer';
import type { INewsletterSubscriberRepository } from '../domain/INewsletterSubscriberRepository';
import {
  EMAIL_DRIP_SCHEDULER,
  NEWSLETTER_MAILER,
  NEWSLETTER_SUBSCRIBER_REPOSITORY,
} from '../domain/token';

export abstract class ActionDAbonne {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @Inject(NEWSLETTER_SUBSCRIBER_REPOSITORY)
    protected readonly repo: INewsletterSubscriberRepository,
    @Inject(NEWSLETTER_MAILER)
    protected readonly mailer: INewsletterMailer,
    @Inject(EMAIL_DRIP_SCHEDULER)
    protected readonly scheduler: IEmailDripScheduler,
  ) {}

  protected enArrierePlan(tache: Promise<void>, echec: string): void {
    void tache.catch((err: unknown) => this.logger.warn(echec, err));
  }
}
