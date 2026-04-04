import { ApiProperty } from '@nestjs/swagger';
import type { StatsResult } from '../../application/services/GetStats.useCase';

/** DTO de reponse pour les statistiques par categorie. */
export class CategoryStatsDto {
  @ApiProperty() category: string;
  @ApiProperty() total: number;
  @ApiProperty() average: number;
  @ApiProperty() trend: number;
}

/** DTO de reponse pour les statistiques de consommation. */
export class StatsResponseDto {
  @ApiProperty({ type: [CategoryStatsDto] })
  byCategory: CategoryStatsDto[];

  @ApiProperty()
  period: string;

  /** Convertit un resultat de stats en DTO de reponse. */
  static fromResult(result: StatsResult): StatsResponseDto {
    const dto = new StatsResponseDto();
    dto.byCategory = result.byCategory;
    dto.period = result.period;
    return dto;
  }
}
