import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsDateString } from 'class-validator';

export class GetPeriodReportDto {
  @ApiProperty({
    enum: ['week', 'month', 'quarter'],
    description: 'Type de periode',
  })
  @IsIn(['week', 'month', 'quarter'])
  period: string;

  @ApiProperty({ description: 'Date de debut (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;
}
