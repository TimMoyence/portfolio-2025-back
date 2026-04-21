import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import type { IEmailDripScheduler } from '../domain/IEmailDripScheduler';
import type { INewsletterMailer } from '../domain/INewsletterMailer';
import type { INewsletterSubscriberRepository } from '../domain/INewsletterSubscriberRepository';
import { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import {
  EMAIL_DRIP_SCHEDULER,
  NEWSLETTER_MAILER,
  NEWSLETTER_SUBSCRIBER_REPOSITORY,
} from '../domain/token';
import type { SubscribeNewsletterCommand } from './dto/SubscribeNewsletter.command';

export interface SubscribeNewsletterResult {
  readonly created: boolean;
  readonly alreadySubscribed: boolean;
  readonly status: NewsletterSubscriber['status'];
}

/**
 * Orchestre l'inscription a la newsletter. Gere explicitement les 3
 * etats frontieres :
 *  - nouveau email : persist + envoi email confirmation (double opt-in),
 *  - email deja `pending` : ne spamme pas, renvoie un email de
 *    confirmation (rate-limite au niveau controleur),
 *  - email deja `confirmed` / `unsubscribed` / `bounced` : pas de
 *    mutation, reponse idempotente (evite les signaux ambigus).
 *
 * L'envoi d'email est fire-and-forget pour ne pas bloquer la reponse
 * HTTP ; les echecs sont journalises. Le planning du drip est declenche
 * uniquement a la confirmation (autre use-case).
 */
@Injectable()
export class SubscribeNewsletterUseCase {
  private readonly logger = new Logger(SubscribeNewsletterUseCase.name);

  constructor(
    @Inject(NEWSLETTER_SUBSCRIBER_REPOSITORY)
    private readonly repo: INewsletterSubscriberRepository,
    @Inject(NEWSLETTER_MAILER)
    private readonly mailer: INewsletterMailer,
    @Inject(EMAIL_DRIP_SCHEDULER)
    private readonly scheduler: IEmailDripScheduler,
  ) {}

  async execute(
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
      if (existing.status === 'pending') {
        this.sendConfirmationAsync(existing);
      }
      return {
        created: false,
        alreadySubscribed: true,
        status: existing.status,
      };
    }

    try {
      const persisted = await this.repo.create(candidate);
      this.sendConfirmationAsync(persisted);
      return {
        created: true,
        alreadySubscribed: false,
        status: persisted.status,
      };
    } catch (error) {
      if (error instanceof ResourceConflictError) {
        // Race condition : une inscription concurrente a cree le
        // subscriber entre `findByEmailAndSource` et `create`. On
        // relit et retourne un resultat idempotent sans exposer la
        // collision cote HTTP.
        const raced = await this.repo.findByEmailAndSource(
          candidate.email,
          candidate.sourceFormationSlug,
        );
        if (raced) {
          if (raced.status === 'pending') {
            this.sendConfirmationAsync(raced);
          }
          return {
            created: false,
            alreadySubscribed: true,
            status: raced.status,
          };
        }
      }
      throw error;
    }
  }

  /**
   * Envoi en fire-and-forget : ne bloque pas la reponse HTTP et
   * journalise toute erreur sans propager. Le reste du pipeline
   * (timeout SMTP, provider down) ne doit pas casser l'inscription
   * cote utilisateur.
   */
  private sendConfirmationAsync(subscriber: NewsletterSubscriber): void {
    void this.mailer
      .sendConfirmation(subscriber)
      .catch((err: unknown) =>
        this.logger.warn('Newsletter confirmation email failed', err),
      );
  }
}
