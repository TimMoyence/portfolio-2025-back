import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsNumber, Max, Min } from 'class-validator';

/** DTO de validation pour les requetes de donnees meteo historiques. */
export class HistoricalQueryDto {
  @ApiProperty({ example: 48.8566, description: 'Latitude' })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 2.3522, description: 'Longitude' })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Date de debut (format ISO)',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2025-01-31',
    description: 'Date de fin (format ISO)',
  })
  @IsDateString()
  endDate: string;
}
