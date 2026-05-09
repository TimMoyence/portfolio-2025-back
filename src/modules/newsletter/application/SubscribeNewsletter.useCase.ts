import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
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
 *
 * La duree de reponse est normalisee au minimum (MIN_RESPONSE_MS) pour
 * eviter les attaques par timing qui permettraient de distinguer un
 * email connu d'un inconnu en mesurant la latence.
 */
@Injectable()
export class SubscribeNewsletterUseCase {
  /**
   * Duree minimale de reponse pour normaliser la latence entre
   * les branches "nouveau email" (SELECT + INSERT + 2×UUID) et "email
   * connu" (SELECT seul). 300 ms > pire cas observe en production (80 ms
   * INSERT + 30 ms 2×UUID), ce qui efface l'oracle timing (E-SEC-1).
   */
  private static readonly MIN_RESPONSE_MS = 300;

  /** Jitter aleatoire [0, MAX_JITTER_MS[ applique au padding. */
  private static readonly MAX_JITTER_MS = 50;

  private readonly logger = new Logger(SubscribeNewsletterUseCase.name);

  constructor(
    @Inject(NEWSLETTER_SUBSCRIBER_REPOSITORY)
    private readonly repo: INewsletterSubscriberRepository,
    @Inject(NEWSLETTER_MAILER)
    private readonly mailer: INewsletterMailer,
  ) {}

  async execute(
    command: SubscribeNewsletterCommand,
  ): Promise<SubscribeNewsletterResult> {
    const startMs = Date.now();
    try {
      return await this.executeInternal(command);
    } finally {
      await this.padResponseTime(startMs);
    }
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
      if (existing.status === 'pending') {
        await this.resendConfirmationIfAllowed(existing);
      }
      return {
        created: false,
        alreadySubscribed: true,
        status: existing.status,
      };
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
            await this.resendConfirmationIfAllowed(raced);
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
   * Re-envoi conditionnel de l'email de confirmation pour un subscriber
   * deja `pending`.
   *
   * - Cooldown anti mail-bombing (E-SEC-14) : si un envoi a eu lieu il y
   *   a moins de `CONFIRMATION_RESEND_COOLDOWN_MS`, skip silencieux.
   * - Rotation du token expire (E-SEC-4) : si le magic link precedent
   *   est expire, on genere un nouveau UUID et on le persiste avant
   *   l'envoi SMTP, sinon le nouvel email contiendrait un lien deja
   *   expire.
   */
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

  /**
   * Persiste `lastConfirmationSentAt` immediatement (cooldown fiable
   * meme si l'email SMTP echoue — au pire on retentera apres 10 min)
   * puis delegue l'envoi en fire-and-forget.
   */
  private async trackAndSendConfirmation(
    subscriber: NewsletterSubscriber,
  ): Promise<void> {
    subscriber.markConfirmationSent();
    // Un subscriber fraichement cree a deja ete persiste via `create` ;
    // on re-update pour materialiser `lastConfirmationSentAt`. Les
    // subscribers existants passent ici avec un id defini.
    if (subscriber.id) {
      await this.repo.update(subscriber);
    }
    this.sendConfirmationAsync(subscriber);
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
        this.logger.warn(
          `Newsletter confirmation email failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      );
  }

  private async padResponseTime(startMs: number): Promise<void> {
    const elapsed = Date.now() - startMs;
    const jitter = Math.floor(
      Math.random() * SubscribeNewsletterUseCase.MAX_JITTER_MS,
    );
    const target = SubscribeNewsletterUseCase.MIN_RESPONSE_MS + jitter;
    if (elapsed < target) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, target - elapsed),
      );
    }
  }
}
