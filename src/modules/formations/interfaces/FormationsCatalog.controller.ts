import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { LireCoursPublicUseCase } from '../application/LireCoursPublic.useCase';
import type { CoursPublicCatalogue } from '../domain/contrats/tirage';
import { CoursPublicCatalogueResponseDto } from './dto/contrat/sujet.response.dto';

@ApiTags('formations')
@Public()
@Controller('formations')
export class FormationsCatalogController {
  constructor(private readonly lireCoursPublic: LireCoursPublicUseCase) {}

  @Get('catalogue/:slug')
  @ApiOperation({
    summary: 'Lit le contenu public d un cours depuis le catalogue',
  })
  @ApiOkResponse({
    type: CoursPublicCatalogueResponseDto,
    description:
      'Sujet public du tirage de référence, avec la version publiée et sa date de bascule : ni notes, ni guide, ni correction, ni quiz noté',
  })
  @ApiNotFoundResponse({ description: 'Cours introuvable' })
  async get(@Param('slug') slug: string): Promise<CoursPublicCatalogue> {
    return this.lireCoursPublic.execute(slug);
  }
}
