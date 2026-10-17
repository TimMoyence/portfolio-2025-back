import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RoutePublique } from '../../../common/interfaces/security/formulaire-public.decorator';
import { GetPresentationInteractionsUseCase } from '../application/GetPresentationInteractions.useCase';
import { PresentationInteractionsResponseDto } from './dto/presentation-interactions.response.dto';

@ApiTags('presentations')
@Controller('presentations')
export class PresentationsController {
  constructor(
    private readonly getInteractionsUseCase: GetPresentationInteractionsUseCase,
  ) {}

  @RoutePublique()
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
