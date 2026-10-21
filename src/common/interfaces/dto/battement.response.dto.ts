import { ApiProperty } from '@nestjs/swagger';

export class BattementResponseDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Instant du battement, qui garde le flux ouvert',
  })
  ts: string;
}
