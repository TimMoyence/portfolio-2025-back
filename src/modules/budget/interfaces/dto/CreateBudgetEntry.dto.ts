import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBudgetEntryDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId: string;

  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Carrefour courses' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: -85.5 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: ['FIXED', 'VARIABLE'], example: 'VARIABLE' })
  @IsIn(['FIXED', 'VARIABLE'])
  type: string;

  @ApiPropertyOptional({ example: 'COMPLETED' })
  @IsOptional()
  @IsIn(['COMPLETED', 'PENDING'])
  state?: string;
}
