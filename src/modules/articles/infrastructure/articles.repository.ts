import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  type ArticleBroadcastSchedule,
  type ArticleDeliveryRecord,
  type ArticleDeliveryWrite,
  type ArticleRecord,
  type ArticleWrite,
  type ArticlesRepository,
  type PagePubliee,
} from '../application/articles.repository';
import { ArticleBroadcastEntity } from './entities/article-broadcast.entity';
import { ArticleDeliveryEntity } from './entities/article-delivery.entity';
import { ArticleEntity } from './entities/article.entity';

@Injectable()
export class TypeOrmArticlesRepository implements ArticlesRepository {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articles: Repository<ArticleEntity>,
    @InjectRepository(ArticleDeliveryEntity)
    private readonly deliveries: Repository<ArticleDeliveryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  findDelivery(deliveryId: string): Promise<ArticleDeliveryRecord | null> {
    return this.deliveries.findOne({ where: { deliveryId } });
  }

  findDeliveryByDeliveryOrIdempotency(
    deliveryId: string,
    idempotencyKey: string,
  ): Promise<ArticleDeliveryRecord | null> {
    return this.deliveries.findOne({
      where: [{ deliveryId }, { idempotencyKey }],
    });
  }

  findDeliveryByNonce(nonce: string): Promise<ArticleDeliveryRecord | null> {
    return this.deliveries.findOne({ where: { nonce } });
  }

  findArticleByRecordId(id: string): Promise<ArticleRecord | null> {
    return this.articles.findOne({ where: { id } });
  }

  async saveArticleAndDelivery(
    article: ArticleWrite,
    delivery: ArticleDeliveryWrite,
    broadcast: ArticleBroadcastSchedule,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const articleRecord = await manager
        .getRepository(ArticleEntity)
        .save(this.articles.create(article));
      await manager.getRepository(ArticleDeliveryEntity).save(
        this.deliveries.create({
          ...delivery,
          articleRecordId: articleRecord.id,
        }),
      );
      await manager.getRepository(ArticleBroadcastEntity).insert({
        articleRecordId: articleRecord.id,
        status: 'scheduled',
        sendAfter: broadcast.sendAfter,
      });
    });
  }

  async listPublished(params: PagePubliee): Promise<ArticleRecord[]> {
    const builder = this.articles
      .createQueryBuilder('article')
      .where('article.status = :status', { status: 'published' })
      .andWhere('article.locale = :locale', { locale: params.locale })
      .orderBy('article.publishedAt', 'DESC')
      .addOrderBy('article.id', 'DESC')
      .skip(params.offset)
      .take(params.limit);

    if (params.tag) {
      builder.andWhere('article.tags @> :tag', {
        tag: JSON.stringify([params.tag]),
      });
    }

    return builder.getMany();
  }

  findPublishedBySlug(
    slug: string,
    locale: 'fr' | 'en',
  ): Promise<ArticleRecord | null> {
    return this.articles.findOne({
      where: { slug, locale, status: 'published' },
    });
  }
}
