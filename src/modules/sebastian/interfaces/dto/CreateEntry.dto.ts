import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/** DTO de requete pour creer une entree de consommation. */
export class CreateEntryDto {
  @ApiProperty({ enum: ['alcohol', 'coffee'], example: 'coffee' })
  @IsIn(['alcohol', 'coffee'])
  category: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Espresso double' })
  @IsOptional()
  @IsString()
  notes?: string;
}
