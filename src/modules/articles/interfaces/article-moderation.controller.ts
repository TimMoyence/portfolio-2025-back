import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
    return this.moderation.withdraw(articleId);
  }

  @Post(':articleId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Republier un article retiré, sans diffusion' })
  @ApiNotFoundResponse({ description: 'Article inconnu' })
  restore(@Param('articleId') articleId: string) {
    return this.moderation.restore(articleId);
  }

  @Post(':articleId/broadcast/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer la diffusion au prochain passage' })
  @ApiConflictResponse({ description: 'Diffusion plus en attente' })
  approveBroadcast(@Param('articleId') articleId: string) {
    return this.moderation.approveBroadcast(articleId);
  }

  @Post(':articleId/broadcast/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler la diffusion abonnés' })
  @ApiConflictResponse({ description: 'Diffusion déjà terminée' })
  cancelBroadcast(@Param('articleId') articleId: string) {
    return this.moderation.cancelBroadcast(articleId);
  }
}
