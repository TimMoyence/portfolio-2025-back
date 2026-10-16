import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { AuPlusElements } from '../../../../common/interfaces/dto/bornes-annoncees.decorator';
import { AuPlusCaracteres } from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import {
  AI_LEVELS,
  BUDGET_TIERS,
  type AiLevel,
  type BudgetTier,
} from '../../domain/InteractionProfile';

export class InteractionProfileDto {
  @ApiPropertyOptional({
    example: 'debutant',
    enum: [...AI_LEVELS, null],
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsIn(AI_LEVELS)
  aiLevel?: AiLevel | null;

  @ApiPropertyOptional({ example: ['chatgpt', 'canva-ai'], type: [String] })
  @IsOptional()
  @IsArray()
  @AuPlusElements(50)
  @IsString({ each: true })
  @AuPlusCaracteres(100, { each: true })
  toolsAlreadyUsed?: string[];

  @ApiPropertyOptional({
    example: '60',
    enum: [...BUDGET_TIERS, null],
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsIn(BUDGET_TIERS)
  budgetTier?: BudgetTier | null;

  @ApiPropertyOptional({ type: String, example: 'coaching', nullable: true })
  @IsOptional()
  @IsString()
  @AuPlusCaracteres(100)
  sector?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Genere-moi un plan marketing pour...',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @AuPlusCaracteres(2000)
  generatedPrompt?: string | null;
}
