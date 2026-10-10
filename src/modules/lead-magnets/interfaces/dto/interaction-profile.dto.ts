import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
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
  @MaxLength(100, { each: true })
  toolsAlreadyUsed?: string[];

  @ApiPropertyOptional({ example: '60', enum: [...BUDGET_TIERS] })
  @IsOptional()
  @IsString()
  @IsIn(BUDGET_TIERS)
  budgetTier?: BudgetTier | null;

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
