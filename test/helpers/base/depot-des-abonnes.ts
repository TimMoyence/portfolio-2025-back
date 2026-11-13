import type { DataSource } from 'typeorm';
import { NewsletterRepositoryTypeORM } from '../../../src/modules/newsletter/infrastructure/Newsletter.repository.typeorm';
import { LienDeConfirmationEntity } from '../../../src/modules/newsletter/infrastructure/entities/LienDeConfirmation.entity';
import { NewsletterSubscriberEntity } from '../../../src/modules/newsletter/infrastructure/entities/NewsletterSubscriber.entity';

export const ENTITES_DE_LA_NEWSLETTER = [
  NewsletterSubscriberEntity,
  LienDeConfirmationEntity,
];

export function depotDesAbonnes(base: DataSource): NewsletterRepositoryTypeORM {
  return new NewsletterRepositoryTypeORM(
    base.getRepository(NewsletterSubscriberEntity),
    base.getRepository(LienDeConfirmationEntity),
  );
}
