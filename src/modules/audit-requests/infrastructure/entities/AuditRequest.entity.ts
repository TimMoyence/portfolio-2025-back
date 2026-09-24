import { ColonnesDeProvenance } from '../../../../common/infrastructure/typeorm/ColonnesDeProvenance';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { AuditProcessingStatus } from '../../domain/AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from '../../domain/AuditReportTiers';
import type { EngineCoverage } from '../../domain/EngineCoverage';

@Entity({ name: 'audit_requests' })
@Index('idx_audit_requests_status_created_at', [
  'processingStatus',
  'createdAt',
])
@Index('idx_audit_requests_request_id', ['requestId'])
@Index('idx_audit_requests_ip_created_at', ['ip', 'createdAt'], {
  where: '"ip" IS NOT NULL',
})
export class AuditRequestEntity extends ColonnesDeProvenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestId: string;

  @Column({ type: 'text' })
  websiteName: string;

  @Column({ type: 'varchar', length: 20 })
  contactMethod: string;

  @Column({ type: 'text' })
  contactValue: string;

  @Column({ type: 'boolean', default: false })
  done: boolean;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  processingStatus: AuditProcessingStatus;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  step?: string | null;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ type: 'text', nullable: true })
  normalizedUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  finalUrl?: string | null;

  @Column({ type: 'jsonb', default: [] })
  redirectChain: string[];

  @Column({ type: 'jsonb', default: {} })
  keyChecks: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  quickWins: string[];

  @Column({ type: 'jsonb', default: {} })
  pillarScores: Record<string, number>;

  @Column({ type: 'text', nullable: true })
  summaryText?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  fullReport?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', name: 'client_report', nullable: true })
  clientReport?: ClientReportSynthesis | null;

  @Column({ type: 'jsonb', name: 'expert_report', nullable: true })
  expertReport?: ExpertReportSynthesis | null;

  @Column({ type: 'jsonb', name: 'engine_coverage', nullable: true })
  engineCoverage?: EngineCoverage | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt?: Date | null;

  @Column({ type: 'text', default: 'fr' })
  locale: string;
}
