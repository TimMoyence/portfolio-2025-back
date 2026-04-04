import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

/** DTO de requete pour lister les entrees avec filtres. */
export class ListEntriesDto {
  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: ['alcohol', 'coffee'] })
  @IsOptional()
  @IsIn(['alcohol', 'coffee'])
  category?: string;
}
