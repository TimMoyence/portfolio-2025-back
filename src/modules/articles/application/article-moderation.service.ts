import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import {
  type ArticleModerationRepository,
  type ArticleRecord,
  type ArticleStatus,
  ARTICLES_REPOSITORY,
} from './articles.repository';
import {
  DELAI_AVANT_ENVOI_MS,
  DIFFUSIONS_REPOSITORY,
  type IDiffusionsRepository,
} from './diffusion/diffusions.repository';
import { ArticleId } from '../domain/contrat/article-contract';

const MODERATION_LIST_LIMIT = 30;

export interface ModerationView {
  article_id: string;
  slug: string;
  locale: SupportedLocale;
  title: string;
  status: ArticleStatus;
  published_at: string;
}

@Injectable()
export class ArticleModerationService {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly articles: ArticleModerationRepository,
    @Inject(DIFFUSIONS_REPOSITORY)
    private readonly diffusions: IDiffusionsRepository,
  ) {}

  async list(): Promise<ModerationView[]> {
    const items = await this.articles.listLatest(MODERATION_LIST_LIMIT);
    return items.map((item) => this.view(item));
  }

  withdraw(articleId: string): Promise<ModerationView> {
    return this.changerLeStatut(articleId, 'withdrawn');
  }

  async restore(articleId: string): Promise<ModerationView> {
    const { id, status } = await this.find(articleId);
    const vue = await this.changerLeStatut(articleId, 'published');
    if (status === 'withdrawn') {
      await this.diffusions.reprogrammer(
        id,
        new Date(Date.now() + DELAI_AVANT_ENVOI_MS),
      );
    }
    return vue;
  }

  private async changerLeStatut(
    articleId: string,
    status: ArticleStatus,
  ): Promise<ModerationView> {
    const article = await this.find(articleId);
    await this.articles.setArticleStatus(article.id, status);
    return this.view(await this.find(articleId));
  }

  private async find(articleId: string): Promise<ArticleRecord> {
    const article = ArticleId.safeParse(articleId).success
      ? await this.articles.findByArticleId(articleId)
      : null;
    if (!article) throw new ResourceNotFoundError('Article not found');
    return article;
  }

  private view(article: ArticleRecord): ModerationView {
    return {
      article_id: article.articleId,
      slug: article.slug,
      locale: article.locale,
      title: article.title,
      status: article.status,
      published_at: article.publishedAt.toISOString(),
    };
  }
}
