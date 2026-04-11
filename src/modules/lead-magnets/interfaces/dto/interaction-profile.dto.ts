import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** DTO de validation du profil d'interaction collecte pendant la presentation. */
export class InteractionProfileDto {
  @ApiPropertyOptional({
    example: 'debutant',
    enum: ['debutant', 'intermediaire', 'avance'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['debutant', 'intermediaire', 'avance'])
  aiLevel?: 'debutant' | 'intermediaire' | 'avance' | null;

  @ApiPropertyOptional({ example: ['chatgpt', 'canva-ai'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  toolsAlreadyUsed?: string[];

  @ApiPropertyOptional({ example: '60', enum: ['0', '60', '120'] })
  @IsOptional()
  @IsString()
  @IsIn(['0', '60', '120'])
  budgetTier?: '0' | '60' | '120' | null;

  @ApiPropertyOptional({ example: 'coaching' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sector?: string | null;

  @ApiPropertyOptional({ example: 'Genere-moi un plan marketing pour...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  generatedPrompt?: string | null;
}
