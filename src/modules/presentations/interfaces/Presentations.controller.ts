import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { GetPresentationInteractionsUseCase } from '../application/GetPresentationInteractions.useCase';
import { PresentationInteractionsResponseDto } from './dto/presentation-interactions.response.dto';

/**
 * Contrôleur des interactions de présentation.
 *
 * Endpoint public — les interactions sont du contenu éditorial,
 * pas des données sensibles.
 */
@ApiTags('presentations')
@Controller('presentations')
export class PresentationsController {
  constructor(
    private readonly getInteractionsUseCase: GetPresentationInteractionsUseCase,
  ) {}

  @Public()
  @Get(':slug/interactions')
  @ApiOperation({
    summary: "Récupérer les interactions d'une présentation par slug",
  })
  @ApiParam({ name: 'slug', example: 'ia-solopreneurs' })
  @ApiOkResponse({ type: PresentationInteractionsResponseDto })
  @ApiNotFoundResponse({ description: 'Présentation introuvable' })
  async getInteractions(
    @Param('slug') slug: string,
  ): Promise<PresentationInteractionsResponseDto> {
    const result = await this.getInteractionsUseCase.execute(slug);
    return PresentationInteractionsResponseDto.fromDomain(result);
  }
}
