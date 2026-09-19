import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type {
  PilotageEcran,
  VotePhase,
} from '../../../domain/contrats/pilotage';
import { PHASES_DE_VOTE } from '../../../domain/contrats/pilotage';
import { ControlSessionRequestDto as ControlSessionServieRequestDto } from '../control-session.request.dto';

export class PilotageEcranRequestDto implements PilotageEcran {
  @ApiProperty({ example: 'B2-01-A3-01-VOTE-HAUSSE-BAISSE' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  screenId: string;

  @ApiPropertyOptional({
    enum: PHASES_DE_VOTE,
    description:
      'Phase d un vote a question jumelle, jamais ramenee en arriere',
  })
  @IsOptional()
  @IsIn(PHASES_DE_VOTE)
  phase?: VotePhase;

  @ApiPropertyOptional({
    description: 'Revelation des pistes fausses d un defi, jamais retiree',
  })
  @IsOptional()
  @IsBoolean()
  revele?: boolean;

  @ApiPropertyOptional({
    description: 'Etapes montrees d un exemple travaille',
    minimum: 0,
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  etayage?: number;
}

export class ControlSessionRequestDto extends ControlSessionServieRequestDto {
  @ApiPropertyOptional({ type: PilotageEcranRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PilotageEcranRequestDto)
  pilotage?: PilotageEcranRequestDto;
}
