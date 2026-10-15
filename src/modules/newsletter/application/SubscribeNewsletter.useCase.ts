import { Inject, Injectable, Logger } from '@nestjs/common';
import { avecUnPlancherDeLatence } from '../../../common/application/plancher-de-latence';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { messageDErreur } from '../../../common/domain/errors/message-d-erreur';
import type { INewsletterMailer } from '../domain/INewsletterMailer';
import type { INewsletterSubscriberRepository } from '../domain/INewsletterSubscriberRepository';
import { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import {
  NEWSLETTER_MAILER,
  NEWSLETTER_SUBSCRIBER_REPOSITORY,
} from '../domain/token';
import type { SubscribeNewsletterCommand } from './dto/SubscribeNewsletter.command';

export interface SubscribeNewsletterResult {
  readonly created: boolean;
  readonly alreadySubscribed: boolean;
  readonly status: NewsletterSubscriber['status'];
}

@Injectable()
export class SubscribeNewsletterUseCase {
  private readonly logger = new Logger(SubscribeNewsletterUseCase.name);

  constructor(
    @Inject(NEWSLETTER_SUBSCRIBER_REPOSITORY)
    private readonly repo: INewsletterSubscriberRepository,
    @Inject(NEWSLETTER_MAILER)
    private readonly mailer: INewsletterMailer,
  ) {}

  execute(
    command: SubscribeNewsletterCommand,
  ): Promise<SubscribeNewsletterResult> {
    return avecUnPlancherDeLatence(() => this.executeInternal(command));
  }

  private async executeInternal(
    command: SubscribeNewsletterCommand,
  ): Promise<SubscribeNewsletterResult> {
    const candidate = NewsletterSubscriber.create({
      email: command.email,
      firstName: command.firstName,
      locale: command.locale,
      sourceFormationSlug: command.sourceFormationSlug,
      termsVersion: command.termsVersion,
      termsAcceptedAt: command.termsAcceptedAt,
    });

    const existing = await this.repo.findByEmailAndSource(
      candidate.email,
      candidate.sourceFormationSlug,
    );

    if (existing) {
      return this.dejaInscrit(existing);
    }

    try {
      const persisted = await this.repo.create(candidate);
      await this.trackAndSendConfirmation(persisted);
      return {
        created: true,
        alreadySubscribed: false,
        status: persisted.status,
      };
    } catch (error) {
      if (error instanceof ResourceConflictError) {
        const raced = await this.repo.findByEmailAndSource(
          candidate.email,
          candidate.sourceFormationSlug,
        );
        if (raced) {
          return this.dejaInscrit(raced);
        }
      }
      throw error;
    }
  }

  private async dejaInscrit(
    abonne: NewsletterSubscriber,
  ): Promise<SubscribeNewsletterResult> {
    if (abonne.status === 'pending') {
      await this.resendConfirmationIfAllowed(abonne);
    }
    return {
      created: false,
      alreadySubscribed: true,
      status: abonne.status,
    };
  }

  private async resendConfirmationIfAllowed(
    subscriber: NewsletterSubscriber,
  ): Promise<void> {
    if (!subscriber.canResendConfirmation()) {
      return;
    }
    if (subscriber.isConfirmTokenExpired()) {
      subscriber.rotateConfirmToken();
      await this.repo.update(subscriber);
    }
    await this.trackAndSendConfirmation(subscriber);
  }

  private async trackAndSendConfirmation(
    subscriber: NewsletterSubscriber,
  ): Promise<void> {
    subscriber.markConfirmationSent();
    if (subscriber.id) {
      await this.repo.update(subscriber);
    }
    this.sendConfirmationAsync(subscriber);
  }

  private sendConfirmationAsync(subscriber: NewsletterSubscriber): void {
    void this.mailer
      .sendConfirmation(subscriber)
      .catch((err: unknown) =>
        this.logger.warn(
          `Newsletter confirmation email failed: ${messageDErreur(err)}`,
        ),
      );
  }
}
