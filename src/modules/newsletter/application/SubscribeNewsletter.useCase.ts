import { Inject, Injectable, Logger } from '@nestjs/common';
import { enArrierePlan } from '../../../common/application/en-arriere-plan';
import { avecUnPlancherDeLatence } from '../../../common/application/plancher-de-latence';
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

interface IssueDeLInscription {
  readonly resultat: SubscribeNewsletterResult;
  readonly aConfirmer: NewsletterSubscriber | null;
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

    try {
      return this.conclure(
        await this.repo.sousVerrouDeLaBoite(candidate.email, (depot) =>
          this.inscrire(depot, candidate),
        ),
      );
    } catch (error) {
      if (error instanceof ResourceConflictError) {
        const issue = await this.repo.sousVerrouDeLaBoite(
          candidate.email,
          async (depot) => {
            const raced = await depot.findByEmailAndSource(
              candidate.email,
              candidate.sourceFormationSlug,
            );
            return raced ? this.dejaInscrit(depot, raced) : null;
          },
        );
        if (issue) {
          return this.conclure(issue);
        }
      }
      throw error;
    }
  }

  private async inscrire(
    depot: INewsletterSubscriberRepository,
    candidate: NewsletterSubscriber,
  ): Promise<IssueDeLInscription> {
    const existing = await depot.findByEmailAndSource(
      candidate.email,
      candidate.sourceFormationSlug,
    );
    if (existing) {
      return this.dejaInscrit(depot, existing);
    }

    const sourceNeuvePourLaBoite = !(await depot.boiteInscriteA(
      candidate.email,
      candidate.sourceFormationSlug,
    ));
    const persisted = await depot.create(candidate);
    const confirmable =
      sourceNeuvePourLaBoite ||
      (await this.laBoitePeutRecevoir(depot, persisted));
    return {
      resultat: {
        created: true,
        alreadySubscribed: false,
        status: persisted.status,
      },
      aConfirmer: confirmable
        ? await this.marquerLaConfirmation(depot, persisted)
        : null,
    };
  }

  private async dejaInscrit(
    depot: INewsletterSubscriberRepository,
    abonne: NewsletterSubscriber,
  ): Promise<IssueDeLInscription> {
    const confirmable =
      abonne.status === 'pending' &&
      abonne.canResendConfirmation() &&
      (await this.laBoitePeutRecevoir(depot, abonne));
    if (confirmable && abonne.isConfirmTokenExpired()) {
      abonne.rotateConfirmToken();
    }
    return {
      resultat: {
        created: false,
        alreadySubscribed: true,
        status: abonne.status,
      },
      aConfirmer: confirmable
        ? await this.marquerLaConfirmation(depot, abonne)
        : null,
    };
  }

  private async laBoitePeutRecevoir(
    depot: INewsletterSubscriberRepository,
    abonne: NewsletterSubscriber,
  ): Promise<boolean> {
    const derniere = await depot.derniereConfirmationVersLaBoiteDe(
      abonne.email,
    );
    return !derniere || derniere.canResendConfirmation();
  }

  private async marquerLaConfirmation(
    depot: INewsletterSubscriberRepository,
    abonne: NewsletterSubscriber,
  ): Promise<NewsletterSubscriber> {
    abonne.markConfirmationSent();
    if (abonne.id) {
      await depot.update(abonne);
    }
    return abonne;
  }

  private conclure({
    resultat,
    aConfirmer,
  }: IssueDeLInscription): SubscribeNewsletterResult {
    if (aConfirmer) {
      this.sendConfirmationAsync(aConfirmer);
    }
    return resultat;
  }

  private sendConfirmationAsync(subscriber: NewsletterSubscriber): void {
    enArrierePlan(
      this.mailer.sendConfirmation(subscriber),
      'Newsletter confirmation email failed',
      this.logger,
    );
  }
}
