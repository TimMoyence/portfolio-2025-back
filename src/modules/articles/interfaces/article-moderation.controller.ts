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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { ArticleModerationService } from '../application/article-moderation.service';
import { ArticleModerationResponseDto } from './dto/article-moderation.response.dto';

@ApiTags('articles-admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Rôle admin requis' })
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('articles/admin')
export class ArticleModerationController {
  constructor(private readonly moderation: ArticleModerationService) {}

  @Get('articles')
  @ApiOperation({ summary: 'Derniers articles et leur statut' })
  @ApiOkResponse({
    description: 'Articles publiés ou retirés',
    type: [ArticleModerationResponseDto],
  })
  list() {
    return this.moderation.list();
  }

  @Post(':articleId/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirer un article du site' })
  @ApiOkResponse({ type: ArticleModerationResponseDto })
  @ApiNotFoundResponse({ description: 'Article inconnu' })
  withdraw(@Param('articleId') articleId: string) {
    return this.moderation.withdraw(articleId);
  }

  @Post(':articleId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Republier un article retiré' })
  @ApiOkResponse({ type: ArticleModerationResponseDto })
  @ApiNotFoundResponse({ description: 'Article inconnu' })
  restore(@Param('articleId') articleId: string) {
    return this.moderation.restore(articleId);
  }
}
