import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, ValidateNested } from 'class-validator';
import { EntierBorne } from '../../../../common/interfaces/dto/bornes-annoncees.decorator';
import type { FreeRange, PacingMode } from '../../domain/PacingMode';
import { PACING_MODES } from '../../domain/PacingMode';

export class FreeRangeDto implements FreeRange {
  @ApiProperty({ example: 3 })
  @EntierBorne(0)
  premier: number;

  @ApiProperty({ example: 9 })
  @EntierBorne(0)
  dernier: number;
}

export class ControlSessionRequestDto {
  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @EntierBorne(0)
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
