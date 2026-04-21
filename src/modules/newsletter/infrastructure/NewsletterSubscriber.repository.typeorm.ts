import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { isSubscriptionStatus } from '../domain/SubscriptionStatus';
import type { INewsletterSubscriberRepository } from '../domain/INewsletterSubscriberRepository';
import { NewsletterSubscriber } from '../domain/NewsletterSubscriber';
import { NewsletterSubscriberEntity } from './entities/NewsletterSubscriber.entity';

/** Code d'erreur Postgres pour la violation d'une contrainte unique. */
const POSTGRES_UNIQUE_VIOLATION = '23505';

/** Implementation TypeORM du port `INewsletterSubscriberRepository`. */
@Injectable()
export class NewsletterSubscriberRepositoryTypeORM implements INewsletterSubscriberRepository {
  constructor(
    @InjectRepository(NewsletterSubscriberEntity)
    private readonly repo: Repository<NewsletterSubscriberEntity>,
  ) {}

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
      confirmedAt: subscriber.confirmedAt,
      unsubscribedAt: subscriber.unsubscribedAt,
    });
    try {
      const saved = await this.repo.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ResourceConflictError(
          'Newsletter subscription already exists for this email and source',
        );
      }
      throw error;
    }
  }

  /**
   * Detecte une violation de contrainte unique Postgres (`23505`). Gere
   * a la fois les erreurs TypeORM natives (`QueryFailedError`) et les
   * erreurs driver enveloppees. Utilise par `create` pour traduire les
   * race conditions `findByEmailAndSource` → `create` en
   * `ResourceConflictError` exploitable cote use-case.
   */
  private isUniqueViolation(error: unknown): boolean {
    if (error instanceof QueryFailedError) {
      const driverCode = (error.driverError as { code?: string })?.code;
      if (driverCode === POSTGRES_UNIQUE_VIOLATION) return true;
    }
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    ) {
      return true;
    }
    return false;
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
    if (!subscriber.id) {
      throw new Error('Cannot update a subscriber without an id');
    }
    await this.repo.update(
      { id: subscriber.id },
      {
        status: subscriber.status,
        confirmedAt: subscriber.confirmedAt,
        unsubscribedAt: subscriber.unsubscribedAt,
      },
    );
    const reloaded = await this.repo.findOneOrFail({
      where: { id: subscriber.id },
    });
    return this.toDomain(reloaded);
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
    subscriber.confirmedAt = entity.confirmedAt;
    subscriber.unsubscribedAt = entity.unsubscribedAt;
    subscriber.createdAt = entity.createdAt;
    return subscriber;
  }
}
