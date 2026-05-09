import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBudgetCategoryDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: 'Courses' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '#22C55E' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  @MaxLength(7)
  color?: string;

  @ApiPropertyOptional({ example: 'shopping-cart' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(50)
  icon?: string;

  @ApiProperty({ enum: ['FIXED', 'VARIABLE'], example: 'VARIABLE' })
  @IsIn(['FIXED', 'VARIABLE'])
  budgetType: string;

  @ApiPropertyOptional({ example: 600, minimum: 0, maximum: 1_000_000 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  budgetLimit?: number;
}
