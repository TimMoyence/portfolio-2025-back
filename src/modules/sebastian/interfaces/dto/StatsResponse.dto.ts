import { ApiProperty } from '@nestjs/swagger';
import type { StatsResult } from '../../application/services/GetStats.useCase';

export class CategoryStatsDto {
  @ApiProperty() category: string;
  @ApiProperty() total: number;
  @ApiProperty() average: number;
  @ApiProperty() trend: number;
}

export class StatsResponseDto {
  @ApiProperty({ type: [CategoryStatsDto] })
  byCategory: CategoryStatsDto[];

  @ApiProperty()
  period: string;

  static fromResult(result: StatsResult): StatsResponseDto {
    const dto = new StatsResponseDto();
    dto.byCategory = result.byCategory;
    dto.period = result.period;
    return dto;
  }
}
