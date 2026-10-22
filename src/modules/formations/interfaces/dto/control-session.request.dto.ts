import { ValeurDuContrat } from '../../../../common/interfaces/dto/valeur-du-contrat.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
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

  @ValeurDuContrat(PACING_MODES, 'PacingMode', {
    facultative: true,
    documentation: { example: 'pilote' },
  })
  mode?: PacingMode;

  @ApiPropertyOptional({ type: FreeRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FreeRangeDto)
  intervalle?: FreeRangeDto;
}
