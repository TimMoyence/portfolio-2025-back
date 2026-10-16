import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { boiteDeLivraison } from '../../../common/domain/value-objects/boite-de-livraison';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { aAffecte } from '../../../common/infrastructure/typeorm/lignes-affectees';
import { enTransactionSurLaCle } from '../../../common/infrastructure/typeorm/verrou-de-transaction';
import { isSubscriptionStatus } from '../domain/SubscriptionStatus';
import type { INewsletterSubscriberRepository } from '../domain/INewsletterSubscriberRepository';
import { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import { NewsletterSubscriberEntity } from './entities/NewsletterSubscriber.entity';

@Injectable()
export class NewsletterSubscriberRepositoryTypeORM
  extends DepotEnDomaine<NewsletterSubscriberEntity, NewsletterSubscriber>
  implements INewsletterSubscriberRepository
{
  constructor(
    @InjectRepository(NewsletterSubscriberEntity)
    repo: Repository<NewsletterSubscriberEntity>,
  ) {
    super(repo);
  }

  create(subscriber: NewsletterSubscriber): Promise<NewsletterSubscriber> {
    return this.enregistrer(
      {
        email: subscriber.email,
        boite: boiteDeLivraison(subscriber.email),
        firstName: subscriber.firstName,
        locale: subscriber.locale,
        sourceFormationSlug: subscriber.sourceFormationSlug,
        status: subscriber.status,
        confirmToken: subscriber.confirmToken,
        unsubscribeToken: subscriber.unsubscribeToken,
        termsVersion: subscriber.termsVersion,
        termsAcceptedAt: subscriber.termsAcceptedAt,
        confirmTokenExpiresAt: subscriber.confirmTokenExpiresAt,
        lastConfirmationSentAt: subscriber.lastConfirmationSentAt,
        confirmedAt: subscriber.confirmedAt,
        unsubscribedAt: subscriber.unsubscribedAt,
      },
      () =>
        new ResourceConflictError(
          'Newsletter subscription already exists for this email and source',
        ),
    );
  }

  findByEmailAndSource(
    email: string,
    sourceFormationSlug: string,
  ): Promise<NewsletterSubscriber | null> {
    return this.trouver({ email, sourceFormationSlug });
  }

  sousVerrouDeLaBoite<T>(
    email: string,
    travail: (depot: INewsletterSubscriberRepository) => Promise<T>,
  ): Promise<T> {
    return enTransactionSurLaCle(this.repo, boiteDeLivraison(email), (repo) =>
      travail(new NewsletterSubscriberRepositoryTypeORM(repo)),
    );
  }

  async derniereConfirmationVersLaBoiteDe(
    email: string,
  ): Promise<NewsletterSubscriber | null> {
    const [derniere] = await this.lister({
      where: {
        boite: boiteDeLivraison(email),
        lastConfirmationSentAt: Not(IsNull()),
      },
      order: { lastConfirmationSentAt: 'DESC' },
      take: 1,
    });
    return derniere ?? null;
  }

  boiteInscriteA(email: string, sourceFormationSlug: string): Promise<boolean> {
    return this.repo.exists({
      where: { boite: boiteDeLivraison(email), sourceFormationSlug },
    });
  }

  findByConfirmToken(token: string): Promise<NewsletterSubscriber | null> {
    return this.trouver({ confirmToken: token });
  }

  findByUnsubscribeToken(token: string): Promise<NewsletterSubscriber | null> {
    return this.trouver({ unsubscribeToken: token });
  }

  async update(
    subscriber: NewsletterSubscriber,
  ): Promise<NewsletterSubscriber> {
    const id = this.idPersiste(subscriber);
    await this.repo.update(
      { id },
      {
        status: subscriber.status,
        confirmToken: subscriber.confirmToken,
        confirmTokenExpiresAt: subscriber.confirmTokenExpiresAt,
        lastConfirmationSentAt: subscriber.lastConfirmationSentAt,
        confirmedAt: subscriber.confirmedAt,
        unsubscribedAt: subscriber.unsubscribedAt,
      },
    );
    return this.relire({ id });
  }

  async markUnsubscribed(
    subscriber: NewsletterSubscriber,
  ): Promise<NewsletterSubscriber | null> {
    const id = this.idPersiste(subscriber);
    const result = await this.repo.update(
      { id, status: Not('unsubscribed') },
      {
        status: subscriber.status,
        unsubscribedAt: subscriber.unsubscribedAt,
      },
    );
    if (!aAffecte(result)) return null;

    return this.relire({ id });
  }

  private idPersiste(subscriber: NewsletterSubscriber): string {
    if (!subscriber.id) {
      throw new Error('Cannot update a subscriber without an id');
    }
    return subscriber.id;
  }

  protected toDomain(entity: NewsletterSubscriberEntity): NewsletterSubscriber {
    const subscriber = new NewsletterSubscriber();
    subscriber.id = entity.id;
    subscriber.email = entity.email;
    subscriber.firstName = entity.firstName;
    subscriber.locale = entity.locale;
    subscriber.sourceFormationSlug = entity.sourceFormationSlug;
    subscriber.status = isSubscriptionStatus(entity.status)
      ? entity.status
      : 'pending';
    subscriber.confirmToken = entity.confirmToken;
    subscriber.unsubscribeToken = entity.unsubscribeToken;
    subscriber.termsVersion = entity.termsVersion;
    subscriber.termsAcceptedAt = entity.termsAcceptedAt;
    subscriber.confirmTokenExpiresAt = entity.confirmTokenExpiresAt;
    subscriber.lastConfirmationSentAt = entity.lastConfirmationSentAt;
    subscriber.confirmedAt = entity.confirmedAt;
    subscriber.unsubscribedAt = entity.unsubscribedAt;
    subscriber.createdAt = entity.createdAt;
    return subscriber;
  }
}
