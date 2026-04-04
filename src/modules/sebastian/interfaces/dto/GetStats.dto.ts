import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** DTO de requete pour obtenir les statistiques. */
export class GetStatsDto {
  @ApiProperty({ enum: ['week', 'month', 'year'], example: 'week' })
  @IsIn(['week', 'month', 'year'])
  period: string;
}
