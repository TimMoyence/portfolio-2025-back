import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { HealthScoreResult } from '../../application/services/CalculateHealthScore.useCase';

/** DTO de decomposition du score par composante. */
export class ScoreBreakdownDto {
  @ApiProperty({ description: 'Score d adherence aux objectifs (0-100)' })
  goalAdherence: number;

  @ApiPropertyOptional({ description: 'Bonus/malus de tendance (phase 2+)' })
  trendBonus?: number;

  @ApiPropertyOptional({ description: 'Bonus de streak (phase 3+)' })
  streakBonus?: number;
}

/** DTO des series consecutives par categorie. */
export class StreaksDto {
  @ApiProperty({ description: 'Jours consecutifs sous l objectif alcool' })
  alcohol: number;

  @ApiProperty({ description: 'Jours consecutifs sous l objectif cafe' })
  coffee: number;
}

/** DTO de reponse pour le score de sante. */
export class HealthScoreResponseDto {
  @ApiProperty({ description: 'Score global (0-100+)' })
  score: number;

  @ApiProperty({ enum: [1, 2, 3], description: 'Phase de calcul' })
  phase: number;

  @ApiProperty({
    type: ScoreBreakdownDto,
    description: 'Decomposition du score',
  })
  breakdown: ScoreBreakdownDto;

  @ApiProperty({
    type: StreaksDto,
    description: 'Series consecutives par categorie',
  })
  streaks: StreaksDto;

  @ApiProperty({ description: 'Message motivationnel' })
  message: string;

  /** Convertit un resultat de score de sante en DTO de reponse. */
  static fromResult(result: HealthScoreResult): HealthScoreResponseDto {
    const dto = new HealthScoreResponseDto();
    dto.score = result.score;
    dto.phase = result.phase;
    dto.breakdown = result.breakdown;
    dto.streaks = result.streaks;
    dto.message = result.message;
    return dto;
  }
}
