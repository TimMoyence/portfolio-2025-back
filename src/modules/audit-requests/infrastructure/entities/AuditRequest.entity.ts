import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { AuditProcessingStatus } from '../../domain/AuditProcessing';

@Entity({ name: 'audit_requests' })
export class AuditRequestEntity {
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

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  redirectChain: string[];

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  keyChecks: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  quickWins: string[];

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  pillarScores: Record<string, number>;

  @Column({ type: 'text', nullable: true })
  summaryText?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  fullReport?: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt?: Date | null;

  @Column({ type: 'inet', nullable: true })
  ip?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  referer?: string;

  @Column({ type: 'varchar', length: 3, default: 'fr' })
  locale: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({
    name: 'updated_or_created_by',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  updatedOrCreatedBy: string | null;
}
