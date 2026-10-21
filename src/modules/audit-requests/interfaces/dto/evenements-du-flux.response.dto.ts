import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { BattementResponseDto } from '../../../../common/interfaces/dto/battement.response.dto';
import { ReferenceOuNul } from '../../../../common/interfaces/dto/reference-ou-nul.decorator';
import type { DonneesParEvenement } from '../../../../common/interfaces/http/flux-d-evenements.decorator';
import { referenceAuContrat } from '../../../../common/interfaces/http/schemas-du-contrat';
import type { StatutDuFluxDAudit } from '../../domain/AuditProcessing';
import {
  AVANCEMENT_D_AUDIT,
  RAPPORT_CLIENT_SERVI,
  type AvancementDAudit,
} from '../../domain/contrats/flux-d-audit';
import type { RapportClientServi } from '../../domain/RapportClientServi';
import { AuditSummaryResponseDto } from './audit-summary.response.dto';

const MOTIF_JAMAIS_EXPOSE =
  'Toujours null : le motif de l echec n est pas expose';

class InstantDAuditResponseDto extends PickType(AuditSummaryResponseDto, [
  'auditId',
] as const) {
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

class AvancementCommunResponseDto extends PickType(AuditSummaryResponseDto, [
  'auditId',
  'progress',
] as const) {
  @ApiProperty({ example: false })
  done: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

class ProgressionDAuditResponseDto extends AvancementCommunResponseDto {
  @ApiProperty({ enum: ['PENDING', 'RUNNING'] })
  status: Extract<StatutDuFluxDAudit, 'PENDING' | 'RUNNING'>;

  @ApiProperty({ type: String, nullable: true, example: 'Analyse des pages' })
  step: string | null;

  @ApiPropertyOptional({
    allOf: [referenceAuContrat(AVANCEMENT_D_AUDIT)],
    description: 'Detail de la phase en cours, absent avant la premiere phase',
  })
  details?: AvancementDAudit;
}

class AuditTermineResponseDto extends PickType(AuditSummaryResponseDto, [
  'auditId',
  'progress',
  'summaryText',
  'keyChecks',
  'quickWins',
  'pillarScores',
] as const) {
  @ApiProperty({ enum: ['COMPLETED'] })
  status: Extract<StatutDuFluxDAudit, 'COMPLETED'>;

  @ApiProperty({ example: true })
  done: boolean;

  @ReferenceOuNul(
    [RAPPORT_CLIENT_SERVI],
    'Rapport client, null avant sa persistance',
  )
  clientReport: RapportClientServi | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

class AuditEchoueResponseDto extends AvancementCommunResponseDto {
  @ApiProperty({ enum: ['FAILED'] })
  status: Extract<StatutDuFluxDAudit, 'FAILED'>;

  @ReferenceOuNul([], MOTIF_JAMAIS_EXPOSE)
  error: null;
}

class AuditExpireResponseDto extends InstantDAuditResponseDto {
  @ApiProperty({ enum: ['TIMEOUT'] })
  status: Extract<StatutDuFluxDAudit, 'TIMEOUT'>;

  @ReferenceOuNul([], MOTIF_JAMAIS_EXPOSE)
  error: null;
}

export const EVENEMENTS_DU_FLUX_D_AUDIT: DonneesParEvenement = {
  progress: ProgressionDAuditResponseDto,
  completed: AuditTermineResponseDto,
  failed: AuditEchoueResponseDto,
  timeout: AuditExpireResponseDto,
  heartbeat: BattementResponseDto,
};
