import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import type { FreeRange, PacingMode } from '../../domain/PacingMode';
import { PACING_MODES } from '../../domain/PacingMode';

export class FreeRangeDto implements FreeRange {
  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(0)
  premier: number;

  @ApiPropertyOptional({ example: 9 })
  @IsInt()
  @Min(0)
  dernier: number;
}

export class ControlSessionRequestDto {
  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ecran?: number;

  @ApiPropertyOptional({ enum: PACING_MODES, example: 'pilote' })
  @IsOptional()
  @IsIn(PACING_MODES as unknown as readonly string[])
  mode?: PacingMode;

  @ApiPropertyOptional({ type: FreeRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FreeRangeDto)
  intervalle?: FreeRangeDto;
}
