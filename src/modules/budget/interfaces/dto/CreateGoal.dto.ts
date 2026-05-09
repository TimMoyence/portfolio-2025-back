import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

const VALID_KINDS = ['SAVINGS', 'SPENDING_LIMIT', 'CATEGORY_LIMIT'] as const;

/** DTO HTTP pour POST /budget/goals. */
export class CreateGoalDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: 'Vacances ete', minLength: 1, maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  name: string;

  @ApiProperty({ enum: VALID_KINDS, example: 'SAVINGS' })
  @IsIn(VALID_KINDS as unknown as string[])
  kind: string;

  @ApiProperty({ example: 1000, minimum: 0, maximum: 10_000_000 })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  targetAmount: number;

  @ApiPropertyOptional({ example: 'category-uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  @IsOptional()
  @IsDateString()
  deadline?: string | null;
}
