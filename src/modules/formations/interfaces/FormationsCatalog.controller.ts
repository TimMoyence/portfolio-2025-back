import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { LireCoursPublicUseCase } from '../application/LireCoursPublic.useCase';
import type { CoursPublic } from '../domain/cours/CoursPublic';

@ApiTags('formations')
@Public()
@Controller('formations')
export class FormationsCatalogController {
  constructor(private readonly lireCoursPublic: LireCoursPublicUseCase) {}

  @Get('catalogue/:slug')
  @ApiOperation({
    summary: 'Lit le contenu public d un cours depuis le catalogue',
  })
  @ApiOkResponse({ description: 'Cours public sans corrections ni notes' })
  @ApiNotFoundResponse({ description: 'Cours introuvable' })
  async get(@Param('slug') slug: string): Promise<CoursPublic> {
    return this.lireCoursPublic.execute(slug);
  }
}
