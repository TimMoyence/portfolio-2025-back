import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleModerationService } from './application/article-moderation.service';
import { ARTICLES_REPOSITORY } from './application/articles.repository';
import { ArticlesService } from './application/articles.service';
import {
  DIFFUSIONS_REPOSITORY,
  MAILER_DES_ARTICLES,
} from './application/diffusion/diffusions.repository';
import { EnvoyerLesDiffusionsDuesUseCase } from './application/diffusion/EnvoyerLesDiffusionsDues.useCase';
import { TypeOrmArticlesRepository } from './infrastructure/articles.repository';
import { TypeOrmDiffusionsRepository } from './infrastructure/diffusions.repository.typeorm';
import { ArticleBroadcastRecipientEntity } from './infrastructure/entities/article-broadcast-recipient.entity';
import { ArticleBroadcastEntity } from './infrastructure/entities/article-broadcast.entity';
import { ArticleDeliveryEntity } from './infrastructure/entities/article-delivery.entity';
import { ArticleEntity } from './infrastructure/entities/article.entity';
import { MailerDesArticlesService } from './infrastructure/MailerDesArticles.service';
import { PlanificateurDesDiffusionsService } from './infrastructure/PlanificateurDesDiffusions.service';
import { ArticleHmacGuard } from './interfaces/article-hmac.guard';
import { ArticleModerationController } from './interfaces/article-moderation.controller';
import { ArticlesController } from './interfaces/articles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticleEntity,
      ArticleDeliveryEntity,
      ArticleBroadcastEntity,
      ArticleBroadcastRecipientEntity,
    ]),
  ],
  controllers: [ArticleModerationController, ArticlesController],
  providers: [
    ArticlesService,
    ArticleModerationService,
    ArticleHmacGuard,
    EnvoyerLesDiffusionsDuesUseCase,
    PlanificateurDesDiffusionsService,
    {
      provide: ARTICLES_REPOSITORY,
      useClass: TypeOrmArticlesRepository,
    },
    { provide: DIFFUSIONS_REPOSITORY, useClass: TypeOrmDiffusionsRepository },
    { provide: MAILER_DES_ARTICLES, useClass: MailerDesArticlesService },
  ],
})
export class ArticlesModule {}
