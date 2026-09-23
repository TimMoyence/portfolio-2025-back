import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  isObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateBy,
  ValidateNested,
} from 'class-validator';
import type {
  PilotageEcran,
  VotePhase,
} from '../../../domain/contrats/pilotage';
import { PHASES_DE_VOTE } from '../../../domain/contrats/pilotage';
import { ControlSessionRequestDto as ControlSessionServieRequestDto } from '../control-session.request.dto';

function EstReglageNumerique(): PropertyDecorator {
  return ValidateBy({
    name: 'estReglageNumerique',
    validator: {
      validate: (valeur: unknown) =>
        isObject(valeur) &&
        Object.values(valeur).every(
          (reglage) => typeof reglage === 'number' && Number.isFinite(reglage),
        ),
      defaultMessage: () =>
        '$property doit associer chaque paramètre de la machine à un nombre fini',
    },
  });
}

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

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Réglages des curseurs de la machine, par clé de paramètre',
    example: { prix: 250, taux: -12.5 },
  })
  @IsOptional()
  @EstReglageNumerique()
  reglages?: Record<string, number>;

  @ApiPropertyOptional({
    description:
      'Projection a la scene des resultats anonymes agreges de cet ecran',
  })
  @IsOptional()
  @IsBoolean()
  resultatsProjetes?: boolean;
}

export class ControlSessionRequestDto extends ControlSessionServieRequestDto {
  @ApiPropertyOptional({ type: PilotageEcranRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PilotageEcranRequestDto)
  pilotage?: PilotageEcranRequestDto;
}
