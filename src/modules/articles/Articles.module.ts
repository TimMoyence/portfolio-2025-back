import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ARTICLE_BROADCAST_MAILER,
  ARTICLE_BROADCAST_REPOSITORY,
} from './application/article-broadcast.repository';
import { ArticleBroadcastService } from './application/article-broadcast.service';
import { ArticleModerationService } from './application/article-moderation.service';
import { ARTICLES_REPOSITORY } from './application/articles.repository';
import { ArticlesService } from './application/articles.service';
import { ArticleBroadcastMailerService } from './infrastructure/article-broadcast.mailer';
import { TypeOrmArticleBroadcastRepository } from './infrastructure/article-broadcast.repository';
import { ArticleBroadcastScheduler } from './infrastructure/article-broadcast.scheduler';
import { TypeOrmArticlesRepository } from './infrastructure/articles.repository';
import { ArticleBroadcastRecipientEntity } from './infrastructure/entities/article-broadcast-recipient.entity';
import { ArticleBroadcastEntity } from './infrastructure/entities/article-broadcast.entity';
import { ArticleDeliveryEntity } from './infrastructure/entities/article-delivery.entity';
import { ArticleEntity } from './infrastructure/entities/article.entity';
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
    ArticleBroadcastService,
    ArticleModerationService,
    ArticleBroadcastScheduler,
    ArticleHmacGuard,
    {
      provide: ARTICLES_REPOSITORY,
      useClass: TypeOrmArticlesRepository,
    },
    {
      provide: ARTICLE_BROADCAST_REPOSITORY,
      useClass: TypeOrmArticleBroadcastRepository,
    },
    {
      provide: ARTICLE_BROADCAST_MAILER,
      useClass: ArticleBroadcastMailerService,
    },
  ],
})
export class ArticlesModule {}
