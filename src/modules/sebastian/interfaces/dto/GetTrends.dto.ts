import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** DTO de requete pour les tendances de consommation. */
export class GetTrendsDto {
  @ApiProperty({ enum: ['7d', '30d'], description: 'Periode de tendance' })
  @IsIn(['7d', '30d'])
  period: string;
}
