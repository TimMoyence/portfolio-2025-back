import { ApiProperty } from '@nestjs/swagger';
import type { AuditProcessingStatus } from '../../domain/AuditProcessing';

export class AuditSummaryResponseDto {
  @ApiProperty({ example: 'f8dd820d-fc38-4f6a-83be-a833aa6be16f' })
  auditId: string;

  @ApiProperty({ example: true })
  ready: boolean;

  @ApiProperty({
    example: 'COMPLETED',
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
  })
  status: AuditProcessingStatus;

  @ApiProperty({ example: 100 })
  progress: number;

  @ApiProperty({
    example:
      'Votre site est accessible et indexable, mais la meta description manque sur plusieurs pages importantes.',
    nullable: true,
  })
  summaryText: string | null;

  @ApiProperty({ example: { accessibility: { https: true, statusCode: 200 } } })
  keyChecks: Record<string, unknown>;

  @ApiProperty({
    example: [
      'Ajouter une meta description sur la page d’accueil.',
      'Déclarer un sitemap.xml dans robots.txt.',
    ],
  })
  quickWins: string[];

  @ApiProperty({
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
