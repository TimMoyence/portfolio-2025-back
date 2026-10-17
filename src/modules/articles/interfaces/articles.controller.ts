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
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { LocaleCode } from '../../../common/domain/value-objects/LocaleCode';
import { RoutePublique } from '../../../common/interfaces/security/formulaire-public.decorator';
import type { ArticleRecord } from '../application/articles.repository';
import { ArticlesService } from '../application/articles.service';
import { ArticleHmacGuard } from './article-hmac.guard';
import {
  ArticleDeliveryResponseDto,
  ArticleIngestResponseDto,
} from './dto/article-delivery.response.dto';
import { ArticleListQueryDto } from './dto/article-list.query.dto';
import {
  ArticleListResponseDto,
  PublishedArticleResponseDto,
} from './dto/article.response.dto';

@ApiTags('articles')
@Controller(['articles', 'api/articles'])
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @RoutePublique()
  @Post('ingest')
  @UseGuards(ArticleHmacGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Recevoir une édition Morning-Brief signée' })
  @ApiAcceptedResponse({
    description: 'Édition acceptée ou déjà reçue',
    type: ArticleIngestResponseDto,
  })
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
  @ApiOkResponse({ type: ArticleDeliveryResponseDto })
  async getDelivery(
    @Param('deliveryId') deliveryId: string,
  ): Promise<ArticleDeliveryResponseDto> {
    const delivery = await this.articles.getDelivery(deliveryId);
    return {
      delivery_id: delivery.deliveryId,
      status: delivery.status,
      article_id: delivery.articleId,
      attempts: delivery.attempts,
      processed_at: delivery.processedAt?.toISOString() ?? null,
    };
  }

  @RoutePublique()
  @Get('feed.xml')
  @ApiOperation({ summary: 'Flux RSS des articles publiés' })
  @ApiProduces('application/rss+xml')
  @ApiOkResponse({ description: 'Flux RSS 2.0', schema: { type: 'string' } })
  async feed(@Query('locale') locale: string, @Res() response: Response) {
    const xml = await this.articles.feed(LocaleCode.resolve(locale).value);
    response.type('application/rss+xml').send(xml);
  }

  @RoutePublique()
  @Get()
  @ApiOperation({ summary: 'Lister les articles publiés' })
  @ApiOkResponse({
    description: 'Liste paginée des articles',
    type: ArticleListResponseDto,
  })
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

  @RoutePublique()
  @Get(':slug')
  @ApiOperation({ summary: 'Lire un article publié' })
  @ApiOkResponse({
    description: 'Article publié normalisé',
    type: PublishedArticleResponseDto,
  })
  async getBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale: string,
  ) {
    return this.publicArticle(
      await this.articles.getPublishedBySlug(
        slug,
        LocaleCode.resolve(locale).value,
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
