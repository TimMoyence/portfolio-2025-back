import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
  IntersectionType,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { BattementResponseDto } from '../../../../../common/interfaces/dto/battement.response.dto';
import { ReferenceOuNul } from '../../../../../common/interfaces/dto/reference-ou-nul.decorator';
import type { DonneesParEvenement } from '../../../../../common/interfaces/http/flux-d-evenements.decorator';
import {
  PACING_MODES,
  RAISONS_DE_FIN,
  type PacingMode,
  type RaisonDeFin,
} from '../../../domain/contrats/contrat-de-l-api';
import type { PilotageServi } from '../../../domain/contrats/pilotage';
import type { ResultatsEnDirect } from '../../../domain/contrats/resultats';
import {
  SESSION_STATES,
  type SessionState,
} from '../../../domain/SessionState';
import { FreeRangeDto } from '../control-session.request.dto';
import { PilotageEcranRequestDto } from './control-session.request.dto';
import { MachineEvalueeResponseDto } from './machine-evaluee.response.dto';
import {
  ResultatsSeanceResponseDto,
  SessionResultsResponseDto,
} from './session-results.response.dto';

class PilotageServiResponseDto
  extends OmitType(PilotageEcranRequestDto, ['screenId'] as const)
  implements PilotageServi
{
  @ApiPropertyOptional({
    description: 'Etapes deja montrees d un exemple travaille, jamais reculees',
    example: 2,
  })
  etayageAtteint?: number;

  @ApiPropertyOptional({
    enum: [true],
    description:
      'Correction de l ecran projetee : les productions n y sont plus acceptees',
  })
  correctionProjetee?: true;

  @ApiPropertyOptional({
    type: MachineEvalueeResponseDto,
    description: 'Sorties de la machine aux reglages projetes',
  })
  sortiesProjetees?: MachineEvalueeResponseDto;

  @ApiPropertyOptional({
    description: 'Question affichee d un vote a question jumelle',
    example: 'b2-01-a3-vote-hausse-baisse',
  })
  questionAffichee?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Question ouverte au vote, null une fois le vote clos',
  })
  questionOuverte?: string | null;
}

@ApiExtraModels(PilotageServiResponseDto)
class EtatDeSeanceResponseDto {
  @ApiProperty({ enum: SESSION_STATES, enumName: 'EtatDeSeance' })
  etat: SessionState;

  @ApiProperty({ enum: PACING_MODES, enumName: 'PacingMode' })
  modeRythme: PacingMode;

  @ApiProperty({ example: 4 })
  ecranCourant: number;

  @ReferenceOuNul(
    [FreeRangeDto],
    'Ecrans ouverts en rythme libre, null en rythme pilote',
  )
  intervalleLibre: FreeRangeDto | null;

  @ApiProperty({ example: 24 })
  participants: number;

  @ApiProperty({
    description: 'Revision de l etat, croissante a chaque changement',
    example: 12,
  })
  revision: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(PilotageServiResponseDto) },
    description: 'Pilotage de chaque ecran, par identifiant d ecran',
  })
  pilotage: Record<string, PilotageServiResponseDto>;

  @ApiProperty({ type: String, format: 'date-time' })
  majLe: string;
}

class ResultatsEnDirectResponseDto
  extends IntersectionType(
    ResultatsSeanceResponseDto,
    PickType(SessionResultsResponseDto, [
      'statistiques',
      'jalons',
      'enigmes',
      'bareme',
    ] as const),
  )
  implements ResultatsEnDirect {}

class FinDuFluxResponseDto {
  @ApiProperty({
    enum: RAISONS_DE_FIN,
    enumName: 'RaisonDeFin',
    description: 'Raison de la fermeture : le client cesse de se reconnecter',
  })
  raison: RaisonDeFin;
}

export const EVENEMENTS_DU_FLUX_DU_POSTE: DonneesParEvenement = {
  etat: EtatDeSeanceResponseDto,
  fin: FinDuFluxResponseDto,
  heartbeat: BattementResponseDto,
};

export const EVENEMENTS_DU_FLUX_DU_PUPITRE: DonneesParEvenement = {
  ...EVENEMENTS_DU_FLUX_DU_POSTE,
  resultats: ResultatsEnDirectResponseDto,
};
