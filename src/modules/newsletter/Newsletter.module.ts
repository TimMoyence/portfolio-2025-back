import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfirmSubscriptionUseCase } from './application/ConfirmSubscription.useCase';
import { SubscribeNewsletterUseCase } from './application/SubscribeNewsletter.useCase';
import { UnsubscribeNewsletterUseCase } from './application/UnsubscribeNewsletter.useCase';
import {
  EMAIL_DRIP_SCHEDULER,
  NEWSLETTER_MAILER,
  NEWSLETTER_SUBSCRIBER_REPOSITORY,
} from './domain/token';
import { NewsletterSubscriberEntity } from './infrastructure/entities/NewsletterSubscriber.entity';
import { NewsletterMailerService } from './infrastructure/NewsletterMailer.service';
import { NewsletterSubscriberRepositoryTypeORM } from './infrastructure/NewsletterSubscriber.repository.typeorm';
import { NoopEmailDripSchedulerService } from './infrastructure/NoopEmailDripScheduler.service';
import { NewsletterController } from './interfaces/Newsletter.controller';

/**
 * Module Newsletter — isole le bounded context du double opt-in et du
 * drip email. Le port `IEmailDripScheduler` est binde sur une impl
 * no-op tant que la queue BullMQ n'est pas livree (S1.5). Le swap
 * s'effectue sans toucher aux use-cases via le token d'injection.
 */
@Module({
  imports: [TypeOrmModule.forFeature([NewsletterSubscriberEntity])],
  controllers: [NewsletterController],
  providers: [
    SubscribeNewsletterUseCase,
    ConfirmSubscriptionUseCase,
    UnsubscribeNewsletterUseCase,
    {
      provide: NEWSLETTER_SUBSCRIBER_REPOSITORY,
      useClass: NewsletterSubscriberRepositoryTypeORM,
    },
    {
      provide: NEWSLETTER_MAILER,
      useClass: NewsletterMailerService,
    },
    {
      provide: EMAIL_DRIP_SCHEDULER,
      useClass: NoopEmailDripSchedulerService,
    },
  ],
})
export class NewsletterModule {}
