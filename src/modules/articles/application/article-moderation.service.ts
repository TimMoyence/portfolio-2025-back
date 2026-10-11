import { Inject, Injectable } from '@nestjs/common';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import {
  ARTICLE_BROADCAST_REPOSITORY,
  type ArticleBroadcastRecord,
  type ArticleBroadcastRepository,
  type ModeratedArticle,
} from './article-broadcast.repository';
import { clotureDeDiffusion, estAnnulable } from './cloture-de-diffusion';

const MODERATION_LIST_LIMIT = 30;

export interface ModerationView {
  article_id: string;
  slug: string;
  locale: 'fr' | 'en';
  title: string;
  status: string;
  published_at: string;
  broadcast: {
    status: string;
    send_after: string;
    sent_count: number;
    failed_count: number;
    completed_at: string | null;
  } | null;
}

@Injectable()
export class ArticleModerationService {
  constructor(
    @Inject(ARTICLE_BROADCAST_REPOSITORY)
    private readonly broadcasts: ArticleBroadcastRepository,
  ) {}

  async list(): Promise<ModerationView[]> {
    const items = await this.broadcasts.listModerated(MODERATION_LIST_LIMIT);
    return items.map((item) => this.view(item));
  }

  async withdraw(articleId: string, now: Date = new Date()) {
    const item = await this.find(articleId);
    await this.broadcasts.setArticleStatus(item.article.id, 'withdrawn');
    if (estAnnulable(item.broadcast)) {
      await this.annuler(item.broadcast, now);
    }
    return this.view(await this.find(articleId));
  }

  async restore(articleId: string) {
    const item = await this.find(articleId);
    await this.broadcasts.setArticleStatus(item.article.id, 'published');
    return this.view(await this.find(articleId));
  }

  async approveBroadcast(articleId: string, now: Date = new Date()) {
    const item = await this.find(articleId);
    if (item.broadcast?.status !== 'scheduled') {
      throw new ResourceConflictError('Broadcast is not awaiting moderation');
    }
    await this.broadcasts.updateBroadcast(item.broadcast.id, {
      sendAfter: now,
    });
    return this.view(await this.find(articleId));
  }

  async cancelBroadcast(articleId: string, now: Date = new Date()) {
    const item = await this.find(articleId);
    if (!estAnnulable(item.broadcast)) {
      throw new ResourceConflictError('Broadcast can no longer be cancelled');
    }
    await this.annuler(item.broadcast, now);
    return this.view(await this.find(articleId));
  }

  private annuler(broadcast: ArticleBroadcastRecord, now: Date): Promise<void> {
    return this.broadcasts.updateBroadcast(
      broadcast.id,
      clotureDeDiffusion('cancelled', now),
    );
  }

  private async find(articleId: string): Promise<ModeratedArticle> {
    const item = await this.broadcasts.findModerated(articleId);
    if (!item) throw new ResourceNotFoundError('Article not found');
    return item;
  }

  private view({ article, broadcast }: ModeratedArticle): ModerationView {
    return {
      article_id: article.articleId,
      slug: article.slug,
      locale: article.locale,
      title: article.title,
      status: article.status,
      published_at: article.publishedAt.toISOString(),
      broadcast: broadcast
        ? {
            status: broadcast.status,
            send_after: broadcast.sendAfter.toISOString(),
            sent_count: broadcast.sentCount,
            failed_count: broadcast.failedCount,
            completed_at: broadcast.completedAt?.toISOString() ?? null,
          }
        : null,
    };
  }
}
