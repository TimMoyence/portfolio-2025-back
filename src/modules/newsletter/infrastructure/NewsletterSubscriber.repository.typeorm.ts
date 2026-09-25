import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { PostgresErrorClassifier } from '../../../common/infrastructure/typeorm/PostgresErrorClassifier';
import { isSubscriptionStatus } from '../domain/SubscriptionStatus';
import type { INewsletterSubscriberRepository } from '../domain/INewsletterSubscriberRepository';
import { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import { NewsletterSubscriberEntity } from './entities/NewsletterSubscriber.entity';

@Injectable()
export class NewsletterSubscriberRepositoryTypeORM
  extends PostgresErrorClassifier
  implements INewsletterSubscriberRepository
{
  constructor(
    @InjectRepository(NewsletterSubscriberEntity)
    private readonly repo: Repository<NewsletterSubscriberEntity>,
  ) {
    super();
  }

  async create(
    subscriber: NewsletterSubscriber,
  ): Promise<NewsletterSubscriber> {
    const entity = this.repo.create({
      email: subscriber.email,
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
    });
    const saved = await this.enregistrerSansDoublon(
      this.repo,
      entity,
      () =>
        new ResourceConflictError(
          'Newsletter subscription already exists for this email and source',
        ),
    );
    return this.toDomain(saved);
  }

  async findByEmailAndSource(
    email: string,
    sourceFormationSlug: string,
  ): Promise<NewsletterSubscriber | null> {
    const entity = await this.repo.findOne({
      where: { email, sourceFormationSlug },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByConfirmToken(
    token: string,
  ): Promise<NewsletterSubscriber | null> {
    const entity = await this.repo.findOne({ where: { confirmToken: token } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUnsubscribeToken(
    token: string,
  ): Promise<NewsletterSubscriber | null> {
    const entity = await this.repo.findOne({
      where: { unsubscribeToken: token },
    });
    return entity ? this.toDomain(entity) : null;
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
    return this.recharger(id);
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
    if (result.affected === 0) return null;

    return this.recharger(id);
  }

  private idPersiste(subscriber: NewsletterSubscriber): string {
    if (!subscriber.id) {
      throw new Error('Cannot update a subscriber without an id');
    }
    return subscriber.id;
  }

  private async recharger(id: string): Promise<NewsletterSubscriber> {
    return this.toDomain(await this.repo.findOneOrFail({ where: { id } }));
  }

  private toDomain(entity: NewsletterSubscriberEntity): NewsletterSubscriber {
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
