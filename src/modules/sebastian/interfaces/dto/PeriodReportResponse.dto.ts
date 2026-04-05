import { ApiProperty } from '@nestjs/swagger';
import type { PeriodReportResult } from '../../application/services/GetPeriodReport.useCase';

/** DTO de reponse pour les totaux de consommation. */
export class TotalsDto {
  @ApiProperty({ description: 'Total alcool' })
  alcohol: number;

  @ApiProperty({ description: 'Total cafe' })
  coffee: number;
}

/** DTO de reponse pour les moyennes quotidiennes. */
export class DailyAvgDto {
  @ApiProperty({ description: 'Moyenne quotidienne alcool' })
  alcohol: number;

  @ApiProperty({ description: 'Moyenne quotidienne cafe' })
  coffee: number;
}

/** DTO de reponse pour le meilleur ou pire jour. */
export class DayScoreDto {
  @ApiProperty({ description: 'Date du jour (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Score de consommation combinee' })
  score: number;
}

/** DTO de reponse pour la comparaison avec la periode precedente. */
export class ComparisonDto {
  @ApiProperty({ description: 'Variation alcool en pourcentage' })
  alcoholDelta: number;

  @ApiProperty({ description: 'Variation cafe en pourcentage' })
  coffeeDelta: number;
}

/** DTO de reponse pour la distribution par jour de semaine. */
export class DayDistributionDto {
  @ApiProperty({ description: 'Jour de semaine (0=dimanche, 6=samedi)' })
  dayOfWeek: number;

  @ApiProperty({ description: 'Consommation alcool' })
  alcohol: number;

  @ApiProperty({ description: 'Consommation cafe' })
  coffee: number;
}

/** DTO de reponse pour un point de la carte thermique. */
export class HeatmapPointDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Consommation alcool' })
  alcohol: number;

  @ApiProperty({ description: 'Consommation cafe' })
  coffee: number;

  @ApiProperty({ description: 'Consommation combinee (alcool + cafe)' })
  combined: number;
}

/** DTO de reponse pour le rapport de periode. */
export class PeriodReportResponseDto {
  @ApiProperty({
    enum: ['week', 'month', 'quarter'],
    description: 'Type de periode',
  })
  period: string;

  @ApiProperty({ description: 'Date de debut (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({ description: 'Date de fin (YYYY-MM-DD)' })
  endDate: string;

  @ApiProperty({ type: TotalsDto, description: 'Totaux de consommation' })
  totals: TotalsDto;

  @ApiProperty({ type: DailyAvgDto, description: 'Moyennes quotidiennes' })
  dailyAvg: DailyAvgDto;

  @ApiProperty({
    type: DayScoreDto,
    description: 'Meilleur jour (consommation la plus faible)',
  })
  best: DayScoreDto;

  @ApiProperty({
    type: DayScoreDto,
    description: 'Pire jour (consommation la plus elevee)',
  })
  worst: DayScoreDto;

  @ApiProperty({
    type: ComparisonDto,
    description: 'Comparaison avec la periode precedente',
  })
  comparison: ComparisonDto;

  @ApiProperty({
    type: [DayDistributionDto],
    description: 'Distribution par jour de semaine',
  })
  distribution: DayDistributionDto[];

  @ApiProperty({
    type: [HeatmapPointDto],
    description: 'Carte thermique jour par jour',
  })
  heatmap: HeatmapPointDto[];

  /** Convertit un resultat de rapport en DTO de reponse. */
  static fromResult(result: PeriodReportResult): PeriodReportResponseDto {
    const dto = new PeriodReportResponseDto();
    dto.period = result.period;
    dto.startDate = result.startDate;
    dto.endDate = result.endDate;
    dto.totals = result.totals;
    dto.dailyAvg = result.dailyAvg;
    dto.best = result.best;
    dto.worst = result.worst;
    dto.comparison = result.comparison;
    dto.distribution = result.distribution;
    dto.heatmap = result.heatmap;
    return dto;
  }
}
