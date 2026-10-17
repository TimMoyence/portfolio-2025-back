import { ApiProperty, PickType } from '@nestjs/swagger';
import type { ModerationView } from '../../application/article-moderation.service';
import {
  type ArticleStatus,
  STATUTS_D_ARTICLE,
} from '../../application/articles.repository';
import { PublishedArticleResponseDto } from './article.response.dto';

export class ArticleModerationResponseDto
  extends PickType(PublishedArticleResponseDto, [
    'article_id',
    'slug',
    'locale',
    'title',
    'published_at',
  ] as const)
  implements ModerationView
{
  @ApiProperty({ enum: [...STATUTS_D_ARTICLE] })
  status: ArticleStatus;
}
