import { ApiProperty } from '@nestjs/swagger';
import {
  type AuditProcessingStatus,
  STATUTS_D_AUDIT,
} from '../../domain/AuditProcessing';

export class AuditSummaryResponseDto {
  @ApiProperty({ example: 'f8dd820d-fc38-4f6a-83be-a833aa6be16f' })
  auditId: string;

  @ApiProperty({ example: true })
  ready: boolean;

  @ApiProperty({
    example: 'COMPLETED',
    enumName: 'StatutDAudit',
    enum: STATUTS_D_AUDIT,
  })
  status: AuditProcessingStatus;

  @ApiProperty({ example: 100 })
  progress: number;

  @ApiProperty({
    type: String,
    example:
      'Votre site est accessible et indexable, mais la meta description manque sur plusieurs pages importantes.',
    nullable: true,
  })
  summaryText: string | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { accessibility: { https: true, statusCode: 200 } },
  })
  keyChecks: Record<string, unknown>;

  @ApiProperty({
    type: [String],
    example: [
      'Ajouter une meta description sur la page d’accueil.',
      'Déclarer un sitemap.xml dans robots.txt.',
    ],
  })
  quickWins: string[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: {
      seo: 72,
      performance: 64,
      technical: 78,
      trust: 60,
      conversion: 66,
    },
  })
  pillarScores: Record<string, number>;
}
