import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** DTO pour la mise a jour d'une entree recurrente de budget. */
export class UpdateRecurringEntryDto {
  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Loyer actualise' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: -1300 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ enum: ['FIXED', 'VARIABLE'] })
  @IsOptional()
  @IsIn(['FIXED', 'VARIABLE'])
  type?: 'FIXED' | 'VARIABLE';

  @ApiPropertyOptional({ enum: ['MONTHLY', 'WEEKLY', 'BIWEEKLY'] })
  @IsOptional()
  @IsIn(['MONTHLY', 'WEEKLY', 'BIWEEKLY'])
  frequency?: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY';

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

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
