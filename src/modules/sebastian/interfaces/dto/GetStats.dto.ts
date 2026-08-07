import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class GetStatsDto {
  @ApiProperty({ enum: ['week', 'month', 'year'], example: 'week' })
  @IsIn(['week', 'month', 'year'])
  period: string;
}
