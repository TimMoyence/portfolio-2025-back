import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuPlusCaracteres } from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import {
  AI_LEVELS,
  BUDGET_TIERS,
  type AiLevel,
  type BudgetTier,
} from '../../domain/InteractionProfile';

export class InteractionProfileDto {
  @ApiPropertyOptional({ example: 'debutant', enum: [...AI_LEVELS] })
  @IsOptional()
  @IsString()
  @IsIn(AI_LEVELS)
  aiLevel?: AiLevel | null;

  @ApiPropertyOptional({ example: ['chatgpt', 'canva-ai'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @AuPlusCaracteres(100, { each: true })
  toolsAlreadyUsed?: string[];

  @ApiPropertyOptional({ example: '60', enum: [...BUDGET_TIERS] })
  @IsOptional()
  @IsString()
  @IsIn(BUDGET_TIERS)
  budgetTier?: BudgetTier | null;

  @ApiPropertyOptional({ example: 'coaching' })
  @IsOptional()
  @IsString()
  @AuPlusCaracteres(100)
  sector?: string | null;

  @ApiPropertyOptional({ example: 'Genere-moi un plan marketing pour...' })
  @IsOptional()
  @IsString()
  @AuPlusCaracteres(2000)
  generatedPrompt?: string | null;
}
