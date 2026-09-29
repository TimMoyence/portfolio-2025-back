import { Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { LireLivretUseCase } from '../application/LireLivret.useCase';
import type { LivretPublie } from '../domain/cours/Livret';
import { LivretResponseDto } from './dto/contrat/livret.response.dto';
import { ControleurFormateur, LectureDeLivret } from './formations-acces';

@ControleurFormateur()
export class FormationsLivretController {
  constructor(private readonly lireLivret: LireLivretUseCase) {}

  @Get('livrets/:slug')
  @LectureDeLivret()
  @ApiOperation({
    summary:
      'Livret papier d un cours publie : sujet etudiant et corrige formateur',
  })
  @ApiOkResponse({ type: LivretResponseDto })
  @ApiNotFoundResponse({ description: 'Cours introuvable' })
  async get(@Param('slug') slug: string): Promise<LivretPublie> {
    return this.lireLivret.execute(slug);
  }
}
