import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/** DTO de mise a jour partielle d'une categorie de budget. */
export class UpdateBudgetCategoryDto {
  @ApiPropertyOptional({ example: 'Alimentation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '#22C55E' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'shopping-cart' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ enum: ['FIXED', 'VARIABLE'], example: 'VARIABLE' })
  @IsOptional()
  @IsIn(['FIXED', 'VARIABLE'])
  budgetType?: 'FIXED' | 'VARIABLE';

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetLimit?: number;
}
