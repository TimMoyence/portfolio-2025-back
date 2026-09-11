import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import type { ArticleRecord } from '../application/articles.repository';
import { ArticlesService } from '../application/articles.service';
import { ArticleHmacGuard } from './article-hmac.guard';
import { ArticleListQueryDto } from './dto/article-list.query.dto';

@ApiTags('articles')
@Controller(['articles', 'api/articles'])
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Public()
  @Post('ingest')
  @UseGuards(ArticleHmacGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Recevoir une édition Morning-Brief signée' })
  @ApiAcceptedResponse({ description: 'Édition acceptée ou déjà reçue' })
  @ApiUnauthorizedResponse({ description: 'Signature machine invalide' })
  async ingest(
    @Body() payload: unknown,
    @Headers('idempotency-key') idempotencyKey: string,
    @Headers('x-morning-brief-nonce') nonce: string,
  ) {
    return this.articles.ingest(payload, idempotencyKey, nonce);
  }

  @Get('ingest/:deliveryId')
  @ApiOperation({ summary: "Consulter l'état d'une livraison" })
  async getDelivery(@Param('deliveryId') deliveryId: string) {
    const delivery = await this.articles.getDelivery(deliveryId);
    return {
      delivery_id: delivery.deliveryId,
      status: delivery.status,
      article_id: delivery.articleId,
      attempts: delivery.attempts,
      processed_at: delivery.processedAt?.toISOString() ?? null,
    };
  }

  @Public()
  @Get('feed.xml')
  @ApiOperation({ summary: 'Flux RSS des articles publiés' })
  async feed(
    @Query('locale') locale: 'fr' | 'en' = 'fr',
    @Res() response: Response,
  ) {
    const xml = await this.articles.feed(locale === 'en' ? 'en' : 'fr');
    response.type('application/rss+xml').send(xml);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lister les articles publiés' })
  @ApiOkResponse({ description: 'Liste paginée des articles' })
  async list(@Query() query: ArticleListQueryDto) {
    const result = await this.articles.listPublished({
      locale: query.locale,
      tag: query.tag,
      cursor: query.cursor,
      limit: query.limit,
    });
    return {
      items: result.items.map((article) => this.publicArticle(article)),
      next_cursor: result.nextCursor,
    };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Lire un article publié' })
  @ApiOkResponse({ description: 'Article publié normalisé' })
  async getBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale: 'fr' | 'en' = 'fr',
  ) {
    return this.publicArticle(
      await this.articles.getPublishedBySlug(
        slug,
        locale === 'en' ? 'en' : 'fr',
      ),
    );
  }

  private publicArticle(article: ArticleRecord) {
    return {
      article_id: article.articleId,
      slug: article.slug,
      locale: article.locale,
      title: article.title,
      excerpt: article.excerpt,
      content_markdown: article.contentMarkdown,
      reading_time_minutes: article.readingTimeMinutes,
      tags: article.tags,
      sections: article.sections,
      sources: article.sources,
      provenance: article.provenance,
      seo: article.seo,
      published_at: article.publishedAt.toISOString(),
      updated_at: article.updatedAt.toISOString(),
    };
  }
}
