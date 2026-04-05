import { ApiProperty } from '@nestjs/swagger';
import type { TrendResult } from '../../application/services/GetTrendData.useCase';

/** DTO representant un point de donnee quotidien de tendance. */
export class TrendDataPointDto {
  @ApiProperty({ description: 'Date au format YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: 'Quantite alcool pour la journee' })
  alcohol: number;

  @ApiProperty({ description: 'Quantite cafe pour la journee' })
  coffee: number;
}

/** DTO representant les objectifs quotidiens. */
export class TrendObjectivesDto {
  @ApiProperty({ description: 'Objectif quotidien alcool' })
  alcohol: number;

  @ApiProperty({ description: 'Objectif quotidien cafe' })
  coffee: number;
}

/** DTO representant le resume des moyennes. */
export class TrendSummaryDto {
  @ApiProperty({ description: 'Moyenne quotidienne alcool' })
  avgAlcohol: number;

  @ApiProperty({ description: 'Moyenne quotidienne cafe' })
  avgCoffee: number;
}

/** DTO de reponse pour les donnees de tendance de consommation. */
export class TrendResponseDto {
  @ApiProperty({ enum: ['7d', '30d'], description: 'Periode de tendance' })
  period: string;

  @ApiProperty({
    type: [TrendDataPointDto],
    description: 'Points de donnee quotidiens',
  })
  dataPoints: TrendDataPointDto[];

  @ApiProperty({
    type: TrendObjectivesDto,
    description: 'Objectifs quotidiens derives des goals',
  })
  objectives: TrendObjectivesDto;

  @ApiProperty({
    type: TrendSummaryDto,
    description: 'Resume des moyennes sur la periode',
  })
  summary: TrendSummaryDto;

  /** Convertit un resultat de tendance en DTO de reponse. */
  static fromResult(result: TrendResult): TrendResponseDto {
    const dto = new TrendResponseDto();
    dto.period = result.period;
    dto.dataPoints = result.dataPoints;
    dto.objectives = result.objectives;
    dto.summary = result.summary;
    return dto;
  }
}
