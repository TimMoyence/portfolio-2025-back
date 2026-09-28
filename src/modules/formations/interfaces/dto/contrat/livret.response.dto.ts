import { ApiProperty } from '@nestjs/swagger';
import type { LivretPublie } from '../../../domain/cours/Livret';
import { DerouleResponseDto } from './deroule.response.dto';
import { SujetResponseDto } from './sujet.response.dto';

export class LivretResponseDto implements LivretPublie {
  @ApiProperty({ description: 'Version publiee du cours', example: 3 })
  version: number;

  @ApiProperty({
    type: SujetResponseDto,
    description:
      'Livret etudiant : sujet complet du tirage du catalogue, sans aucun element du corrige',
  })
  sujet: SujetResponseDto;

  @ApiProperty({
    type: DerouleResponseDto,
    description:
      'Corrige formateur : deroule annote du meme tirage, notes, seuils et corriges',
  })
  corrige: DerouleResponseDto;
}
