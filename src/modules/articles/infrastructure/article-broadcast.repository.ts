import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  ArticleBroadcastPatch,
  ArticleBroadcastRecord,
  ArticleBroadcastRepository,
  BroadcastRecipient,
  ModeratedArticle,
  RechercheDeDestinataires,
} from '../application/article-broadcast.repository';
import type { ArticleStatus } from '../application/articles.repository';
import { ArticleBroadcastRecipientEntity } from './entities/article-broadcast-recipient.entity';
import { ArticleBroadcastEntity } from './entities/article-broadcast.entity';
import { ArticleEntity } from './entities/article.entity';

function toRecord(entity: ArticleBroadcastEntity): ArticleBroadcastRecord {
  return {
    id: entity.id,
    articleRecordId: entity.articleRecordId,
    status: entity.status,
    sendAfter: entity.sendAfter,
    lockedUntil: entity.lockedUntil,
    sentCount: entity.sentCount,
    failedCount: entity.failedCount,
    completedAt: entity.completedAt,
  };
}

@Injectable()
export class TypeOrmArticleBroadcastRepository implements ArticleBroadcastRepository {
  constructor(private readonly dataSource: DataSource) {}

  async claimDue(
    now: Date,
    lockedUntil: Date,
  ): Promise<ArticleBroadcastRecord | null> {
    const [rows] = await this.dataSource.query<[Array<{ id: string }>, number]>(
      `UPDATE "article_broadcasts" SET "status" = 'sending', "lockedUntil" = $2
       WHERE "id" = (
         SELECT "id" FROM "article_broadcasts"
         WHERE ("status" = 'scheduled' AND "sendAfter" <= $1)
            OR ("status" = 'sending' AND ("lockedUntil" IS NULL OR "lockedUntil" <= $1))
         ORDER BY "sendAfter" ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING "id"`,
      [now, lockedUntil],
    );
    const claimed = rows[0];
    if (!claimed) return null;
    const entity = await this.dataSource
      .getRepository(ArticleBroadcastEntity)
      .findOneByOrFail({ id: claimed.id });
    return toRecord(entity);
  }

  findPendingRecipients({
    broadcastId,
    source,
    locale,
    limit,
  }: RechercheDeDestinataires): Promise<BroadcastRecipient[]> {
    return this.dataSource.query(
      `SELECT s."id" AS "subscriberId", s."email", s."first_name" AS "firstName",
              s."unsubscribe_token" AS "unsubscribeToken"
       FROM "newsletter_subscribers" s
       WHERE s."status" = 'confirmed'
         AND s."source_formation_slug" = $2
         AND (s."locale" = $3 OR s."locale" LIKE $3 || '-%')
         AND NOT EXISTS (
           SELECT 1 FROM "article_broadcast_recipients" r
           WHERE r."broadcastId" = $1 AND r."subscriberId" = s."id"
         )
       ORDER BY s."confirmed_at" ASC NULLS LAST, s."id" ASC
       LIMIT $4`,
      [broadcastId, source, locale, limit],
    );
  }

  async reserveRecipient(
    broadcastId: string,
    subscriberId: string,
  ): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(ArticleBroadcastRecipientEntity)
      .values({ broadcastId, subscriberId, status: 'sending' })
      .orIgnore()
      .returning(['id'])
      .execute();
    const inserted = result.raw as Array<{ id: string }>;
    return inserted.length === 1;
  }

  async markRecipient(
    broadcastId: string,
    subscriberId: string,
    status: 'sent' | 'failed',
    error: string | null,
  ): Promise<void> {
    await this.dataSource
      .getRepository(ArticleBroadcastRecipientEntity)
      .update(
        { broadcastId, subscriberId },
        { status, error, processedAt: new Date() },
      );
  }

  async updateBroadcast(
    id: string,
    patch: ArticleBroadcastPatch,
  ): Promise<void> {
    await this.dataSource
      .getRepository(ArticleBroadcastEntity)
      .update({ id }, patch);
  }

  async findModerated(articleId: string): Promise<ModeratedArticle | null> {
    const article = await this.dataSource
      .getRepository(ArticleEntity)
      .findOne({ where: { articleId } });
    if (!article) return null;
    const broadcast = await this.dataSource
      .getRepository(ArticleBroadcastEntity)
      .findOne({ where: { articleRecordId: article.id } });
    return { article, broadcast: broadcast ? toRecord(broadcast) : null };
  }

  async listModerated(limit: number): Promise<ModeratedArticle[]> {
    const items = await this.dataSource.getRepository(ArticleEntity).find({
      order: { publishedAt: 'DESC', id: 'DESC' },
      take: limit,
    });
    if (items.length === 0) return [];
    const broadcasts = await this.dataSource
      .getRepository(ArticleBroadcastEntity)
      .createQueryBuilder('broadcast')
      .where('broadcast.articleRecordId IN (:...ids)', {
        ids: items.map((item) => item.id),
      })
      .getMany();
    const byArticle = new Map(
      broadcasts.map((broadcast) => [broadcast.articleRecordId, broadcast]),
    );
    return items.map((article) => {
      const broadcast = byArticle.get(article.id);
      return { article, broadcast: broadcast ? toRecord(broadcast) : null };
    });
  }

  async setArticleStatus(
    articleRecordId: string,
    status: ArticleStatus,
  ): Promise<void> {
    await this.dataSource
      .getRepository(ArticleEntity)
      .update({ id: articleRecordId }, { status });
  }
}
