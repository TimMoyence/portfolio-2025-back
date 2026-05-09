import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

const VALID_KINDS = ['SAVINGS', 'SPENDING_LIMIT', 'CATEGORY_LIMIT'] as const;

/** DTO HTTP pour PATCH /budget/goals/:id. Tous les champs optionnels. */
export class UpdateGoalDto {
  @ApiPropertyOptional({
    example: 'Vacances ete',
    minLength: 1,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @ApiPropertyOptional({ enum: VALID_KINDS })
  @IsOptional()
  @IsIn(VALID_KINDS as unknown as string[])
  kind?: string;

  @ApiPropertyOptional({ example: 1500, minimum: 0, maximum: 10_000_000 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  targetAmount?: number;

  @ApiPropertyOptional({ example: 'category-uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  @IsOptional()
  @IsDateString()
  deadline?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
