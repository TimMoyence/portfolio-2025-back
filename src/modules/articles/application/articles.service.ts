import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ArticleContract,
  type ArticleIngestEnvelope,
} from '../domain/article-contract';
import {
  type ArticleDeliveryRecord,
  type ArticleRecord,
  type ArticleWrite,
  ARTICLES_REPOSITORY,
  type ArticlesRepository,
} from './articles.repository';
import { Inject } from '@nestjs/common';

export interface ArticleListQuery {
  locale: 'fr' | 'en';
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
    if (!parsed.success) {
      throw new UnprocessableEntityException('Invalid article payload');
    }
    if (!idempotencyKey || idempotencyKey.length > 160) {
      throw new UnprocessableEntityException('Invalid article payload');
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
        throw new ConflictException('Idempotency key already used');
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
      throw new ConflictException('Delivery already processed');
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
    const delivery = await this.articles.findDelivery(deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    const article = await this.articles.findArticleByRecordId(
      delivery.articleRecordId,
    );
    if (!article) throw new NotFoundException('Delivery not found');
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
    locale: 'fr' | 'en',
  ): Promise<ArticleRecord> {
    const article = await this.articles.findPublishedBySlug(slug, locale);
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async feed(locale: 'fr' | 'en'): Promise<string> {
    const { items } = await this.listPublished({ locale, limit: 24 });
    const xml = items
      .map(
        (article) =>
          `<item><title>${this.escapeXml(article.title)}</title>` +
          `<link>https://asilidesign.fr/${locale}/articles/${this.escapeXml(article.slug)}</link>` +
          `<guid isPermaLink="false">${this.escapeXml(article.articleId)}</guid>` +
          `<description>${this.escapeXml(article.excerpt)}</description></item>`,
      )
      .join('');
    return (
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<rss version="2.0"><channel>' +
      `<title>Asili Design — Articles</title>` +
      `<link>https://asilidesign.fr/${locale}/articles</link>${xml}</channel></rss>`
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
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}
