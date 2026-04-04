import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** DTO pour la creation d'une entree recurrente de budget. */
export class CreateRecurringEntryDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId: string;

  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'Loyer mensuel' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: -1200 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: ['FIXED', 'VARIABLE'], example: 'FIXED' })
  @IsIn(['FIXED', 'VARIABLE'])
  type: string;

  @ApiProperty({ enum: ['MONTHLY', 'WEEKLY', 'BIWEEKLY'], example: 'MONTHLY' })
  @IsIn(['MONTHLY', 'WEEKLY', 'BIWEEKLY'])
  frequency: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 31 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
