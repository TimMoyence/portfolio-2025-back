import { ApiProperty } from '@nestjs/swagger';
import type { TrendResult } from '../../application/services/GetTrendData.useCase';

export class TrendDataPointDto {
  @ApiProperty({ description: 'Date au format YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: 'Quantite alcool pour la journee' })
  alcohol: number;

  @ApiProperty({ description: 'Quantite cafe pour la journee' })
  coffee: number;
}

export class TrendObjectivesDto {
  @ApiProperty({ description: 'Objectif quotidien alcool' })
  alcohol: number;

  @ApiProperty({ description: 'Objectif quotidien cafe' })
  coffee: number;
}

export class TrendSummaryDto {
  @ApiProperty({ description: 'Moyenne quotidienne alcool' })
  avgAlcohol: number;

  @ApiProperty({ description: 'Moyenne quotidienne cafe' })
  avgCoffee: number;
}

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

  static fromResult(result: TrendResult): TrendResponseDto {
    const dto = new TrendResponseDto();
    dto.period = result.period;
    dto.dataPoints = result.dataPoints;
    dto.objectives = result.objectives;
    dto.summary = result.summary;
    return dto;
  }
}
