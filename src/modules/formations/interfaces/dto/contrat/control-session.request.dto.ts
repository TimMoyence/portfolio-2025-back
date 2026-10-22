import { ValeurDuContrat } from '../../../../../common/interfaces/dto/valeur-du-contrat.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  isObject,
  IsOptional,
  ValidateBy,
  ValidateNested,
} from 'class-validator';
import { EntierBorne } from '../../../../../common/interfaces/dto/bornes-annoncees.decorator';
import { TexteBorne } from '../../../../../common/interfaces/dto/longueur-de-texte.decorator';
import type {
  PilotageEcran,
  VotePhase,
} from '../../../domain/contrats/pilotage';
import { PHASES_DE_VOTE } from '../../../domain/contrats/pilotage';
import { ControlSessionRequestDto as ControlSessionServieRequestDto } from '../control-session.request.dto';

export function EstReglageNumerique(): PropertyDecorator {
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
  @TexteBorne(1, 120)
  screenId: string;

  @ValeurDuContrat(PHASES_DE_VOTE, 'PhaseDeVote', {
    facultative: true,
    documentation: {
      description:
        'Phase d un vote a question jumelle, jamais ramenee en arriere',
    },
  })
  phase?: VotePhase;

  @ApiPropertyOptional({
    description: 'Revelation des pistes fausses d un defi, jamais retiree',
  })
  @IsOptional()
  @IsBoolean()
  revele?: boolean;

  @ApiPropertyOptional({
    description: 'Etapes montrees d un exemple travaille',
    example: 2,
  })
  @IsOptional()
  @EntierBorne(0)
  etayage?: number;

  @ApiPropertyOptional({
    description:
      'Explications devoilees sur l ecran d un exercice corrige sur place, dans leur ordre, jamais retirees',
    example: 1,
  })
  @IsOptional()
  @EntierBorne(0)
  explicationsDevoilees?: number;

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

  @ApiPropertyOptional({
    description:
      'Affichage immediat des options d un rappel, sans attendre la fin du decompte, jamais retire',
  })
  @IsOptional()
  @IsBoolean()
  optionsAffichees?: boolean;
}

export class ControlSessionRequestDto extends ControlSessionServieRequestDto {
  @ApiPropertyOptional({ type: PilotageEcranRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PilotageEcranRequestDto)
  pilotage?: PilotageEcranRequestDto;
}
