import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfirmSubscriptionUseCase } from './application/ConfirmSubscription.useCase';
import { SubscribeNewsletterUseCase } from './application/SubscribeNewsletter.useCase';
import { UnsubscribeNewsletterUseCase } from './application/UnsubscribeNewsletter.useCase';
import { NEWSLETTER_MAILER, NEWSLETTER_REPOSITORY } from './domain/token';
import { NewsletterRepositoryTypeORM } from './infrastructure/Newsletter.repository.typeorm';
import { NewsletterMailerService } from './infrastructure/NewsletterMailer.service';
import { LienDeConfirmationEntity } from './infrastructure/entities/LienDeConfirmation.entity';
import { NewsletterSubscriberEntity } from './infrastructure/entities/NewsletterSubscriber.entity';
import { NewsletterController } from './interfaces/Newsletter.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NewsletterSubscriberEntity,
      LienDeConfirmationEntity,
    ]),
  ],
  controllers: [NewsletterController],
  providers: [
    SubscribeNewsletterUseCase,
    ConfirmSubscriptionUseCase,
    UnsubscribeNewsletterUseCase,
    { provide: NEWSLETTER_REPOSITORY, useClass: NewsletterRepositoryTypeORM },
    { provide: NEWSLETTER_MAILER, useClass: NewsletterMailerService },
  ],
})
export class NewsletterModule {}
