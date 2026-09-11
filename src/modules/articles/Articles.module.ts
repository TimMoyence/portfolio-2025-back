import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ARTICLES_REPOSITORY } from './application/articles.repository';
import { ArticlesService } from './application/articles.service';
import { TypeOrmArticlesRepository } from './infrastructure/articles.repository';
import { ArticleDeliveryEntity } from './infrastructure/entities/article-delivery.entity';
import { ArticleEntity } from './infrastructure/entities/article.entity';
import { ArticleHmacGuard } from './interfaces/article-hmac.guard';
import { ArticlesController } from './interfaces/articles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity, ArticleDeliveryEntity])],
  controllers: [ArticlesController],
  providers: [
    ArticlesService,
    ArticleHmacGuard,
    {
      provide: ARTICLES_REPOSITORY,
      useClass: TypeOrmArticlesRepository,
    },
  ],
})
export class ArticlesModule {}
