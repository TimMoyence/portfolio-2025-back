import { Injectable } from '@nestjs/common';
import {
  escapeHtml,
  htmlEmis,
} from '../../../common/domain/texte/html-escape.util';
import { estEntierPositif } from '../../../common/domain/nombres/est-entier-positif';
import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { ResourceNotFoundError } from '../../../common/domain/errors/ResourceNotFoundError';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import {
  ArticleContract,
  type ArticleIngestEnvelope,
  ArticleSlug,
  DeliveryId,
} from '../domain/article-contract';
import {
  type ArticleDeliveryRecord,
  type ArticleRecord,
  type ArticleWrite,
  ARTICLES_REPOSITORY,
  type ArticlesRepository,
} from './articles.repository';
import { Inject } from '@nestjs/common';
import { urlDuSite, urlPubliqueDeLApi } from '../../../config/urls-publiques';
import { articlePageUrl } from './article-settings';

const FEED_LANGUAGE = { fr: 'fr-FR', en: 'en' } as const;
const FEED_DESCRIPTION = {
  fr: 'Veille IA quotidienne, sourcée et vérifiable, par Asili Design.',
  en: 'Daily sourced AI briefing by Asili Design.',
} as const;

function texteXml(valeur: string): string {
  return htmlEmis(escapeHtml(valeur));
}

export interface ArticleListQuery {
  locale: SupportedLocale;
  tag?: string;
  cursor?: string;
  limit: number;
}

export interface ArticleIngestResult {
  delivery_id: string;
  status: 'accepted';
  article_id: string;
  duplicate: boolean;
  received_at: string;
}

@Injectable()
export class ArticlesService {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly articles: ArticlesRepository,
  ) {}

  async ingest(
    payload: unknown,
    idempotencyKey: string,
    nonce: string,
  ): Promise<ArticleIngestResult> {
    const parsed = ArticleContract.safeParse(payload);
    if (!parsed.success || !idempotencyKey || idempotencyKey.length > 160) {
      throw new InvalidInputError('Invalid article payload');
    }

    const envelope = parsed.data;
    const existing = await this.articles.findDeliveryByDeliveryOrIdempotency(
      envelope.delivery_id,
      idempotencyKey,
    );
    if (existing) {
      const existingArticle = await this.articles.findArticleByRecordId(
        existing.articleRecordId,
      );
      if (
        !existingArticle ||
        existingArticle.articleId !== envelope.article.article_id ||
        existingArticle.contentSha256 !==
          envelope.article.provenance.content_sha256
      ) {
        throw new ResourceConflictError('Idempotency key already used');
      }
      return {
        delivery_id: existing.deliveryId,
        status: 'accepted',
        article_id: existingArticle.articleId,
        duplicate: true,
        received_at: existing.receivedAt.toISOString(),
      };
    }

    const nonceAlreadyUsed = await this.articles.findDeliveryByNonce(nonce);
    if (nonceAlreadyUsed) {
      throw new ResourceConflictError('Delivery already processed');
    }

    const receivedAt = new Date();
    const article = this.toEntity(envelope);
    const delivery = {
      deliveryId: envelope.delivery_id,
      idempotencyKey,
      nonce,
      status: 'accepted',
      attempts: 1,
      processedAt: receivedAt,
    } as const;

    await this.articles.saveArticleAndDelivery(article, delivery);

    return {
      delivery_id: envelope.delivery_id,
      status: 'accepted',
      article_id: envelope.article.article_id,
      duplicate: false,
      received_at: receivedAt.toISOString(),
    };
  }

  async getDelivery(
    deliveryId: string,
  ): Promise<ArticleDeliveryRecord & { articleId: string }> {
    const delivery = DeliveryId.safeParse(deliveryId).success
      ? await this.articles.findDelivery(deliveryId)
      : null;
    if (!delivery) throw new ResourceNotFoundError('Delivery not found');
    const article = await this.articles.findArticleByRecordId(
      delivery.articleRecordId,
    );
    if (!article) throw new ResourceNotFoundError('Delivery not found');
    return { ...delivery, articleId: article.articleId };
  }

  async listPublished(query: ArticleListQuery): Promise<{
    items: ArticleRecord[];
    nextCursor: string | null;
  }> {
    const offset = this.decodeCursor(query.cursor);
    const rows = await this.articles.listPublished({
      locale: query.locale,
      tag: query.tag,
      offset,
      limit: query.limit + 1,
    });
    const hasNext = rows.length > query.limit;
    const items = rows.slice(0, query.limit);
    return {
      items,
      nextCursor: hasNext ? this.encodeCursor(offset + query.limit) : null,
    };
  }

  async getPublishedBySlug(
    slug: string,
    locale: SupportedLocale,
  ): Promise<ArticleRecord> {
    const article = ArticleSlug.safeParse(slug).success
      ? await this.articles.findPublishedBySlug(slug, locale)
      : null;
    if (!article) throw new ResourceNotFoundError('Article not found');
    return article;
  }

  async feed(locale: SupportedLocale): Promise<string> {
    const { items } = await this.listPublished({ locale, limit: 24 });
    const xml = items
      .map(
        (article) =>
          `<item><title>${texteXml(article.title)}</title>` +
          `<link>${texteXml(articlePageUrl(locale, article.slug))}</link>` +
          `<guid isPermaLink="false">${texteXml(article.articleId)}</guid>` +
          `<pubDate>${article.publishedAt.toUTCString()}</pubDate>` +
          `<description>${texteXml(article.excerpt)}</description></item>`,
      )
      .join('');
    const lastBuild = items.reduce<Date | null>(
      (latest, article) =>
        latest === null || article.updatedAt > latest
          ? article.updatedAt
          : latest,
      null,
    );
    const selfUrl = urlPubliqueDeLApi(`articles/feed.xml?locale=${locale}`);
    return (
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>' +
      `<title>Asili Design — Articles</title>` +
      `<link>${texteXml(urlDuSite() + '/' + locale + '/articles')}</link>` +
      `<description>${texteXml(FEED_DESCRIPTION[locale])}</description>` +
      `<atom:link href="${texteXml(selfUrl)}" rel="self" type="application/rss+xml"/>` +
      `<language>${FEED_LANGUAGE[locale]}</language>` +
      `<lastBuildDate>${(lastBuild ?? new Date()).toUTCString()}</lastBuildDate>` +
      `${xml}</channel></rss>`
    );
  }

  private toEntity(envelope: ArticleIngestEnvelope): ArticleWrite {
    const article = envelope.article;
    return {
      articleId: article.article_id,
      slug: article.slug,
      locale: article.locale,
      status: article.status,
      title: article.title,
      excerpt: article.excerpt,
      contentMarkdown: article.content_markdown,
      readingTimeMinutes: article.reading_time_minutes ?? null,
      tags: article.tags ?? [],
      sections: article.sections,
      sources: article.sources,
      provenance: article.provenance,
      seo: article.seo,
      publishedAt: new Date(article.published_at),
      updatedAt: new Date(article.updated_at),
      contentSha256: article.provenance.content_sha256,
    };
  }

  private encodeCursor(offset: number): string {
    return Buffer.from(String(offset), 'utf8').toString('base64url');
  }

  private decodeCursor(cursor: string | undefined): number {
    if (!cursor) return 0;
    const value = Number(Buffer.from(cursor, 'base64url').toString('utf8'));
    return estEntierPositif(value) ? value : 0;
  }
}
