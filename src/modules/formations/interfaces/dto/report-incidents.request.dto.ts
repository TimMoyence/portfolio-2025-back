import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MAX_INCIDENTS_PAR_ENVOI } from '../../domain/IncidentType';

export class IncidentEntryDto {
  @ApiProperty({ example: 'tab_hidden' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  type: string;

  @ApiPropertyOptional({ example: { duree: 1200 } })
  @IsOptional()
  @IsObject()
  contexte?: Record<string, unknown>;

  @ApiProperty({ example: '2026-09-11T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  horodatage: Date;
}

export class ReportIncidentsRequestDto {
  @ApiProperty({ type: [IncidentEntryDto] })
  @IsArray()
  @ArrayMaxSize(MAX_INCIDENTS_PAR_ENVOI)
  @ValidateNested({ each: true })
  @Type(() => IncidentEntryDto)
  incidents: IncidentEntryDto[];
}
