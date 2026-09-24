import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { ArticleModerationService } from '../application/article-moderation.service';

const ARTICLE_ID = /^morning-brief-\d{4}-\d{2}-\d{2}-(fr|en)$/;

function articleIdOf(value: string): string {
  if (!ARTICLE_ID.test(value)) throw new NotFoundException('Article not found');
  return value;
}

@ApiTags('articles-admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Rôle admin requis' })
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('articles/admin')
export class ArticleModerationController {
  constructor(private readonly moderation: ArticleModerationService) {}

  @Get('articles')
  @ApiOperation({ summary: 'Derniers articles et état de leur diffusion' })
  @ApiOkResponse({ description: 'Articles publiés ou retirés' })
  list() {
    return this.moderation.list();
  }

  @Post(':articleId/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirer un article du site et annuler sa diffusion abonnés',
  })
  @ApiNotFoundResponse({ description: 'Article inconnu' })
  withdraw(@Param('articleId') articleId: string) {
    return this.moderation.withdraw(articleIdOf(articleId));
  }

  @Post(':articleId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Republier un article retiré, sans diffusion' })
  @ApiNotFoundResponse({ description: 'Article inconnu' })
  restore(@Param('articleId') articleId: string) {
    return this.moderation.restore(articleIdOf(articleId));
  }

  @Post(':articleId/broadcast/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer la diffusion au prochain passage' })
  @ApiConflictResponse({ description: 'Diffusion plus en attente' })
  approveBroadcast(@Param('articleId') articleId: string) {
    return this.moderation.approveBroadcast(articleIdOf(articleId));
  }

  @Post(':articleId/broadcast/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler la diffusion abonnés' })
  @ApiConflictResponse({ description: 'Diffusion déjà terminée' })
  cancelBroadcast(@Param('articleId') articleId: string) {
    return this.moderation.cancelBroadcast(articleIdOf(articleId));
  }
}
