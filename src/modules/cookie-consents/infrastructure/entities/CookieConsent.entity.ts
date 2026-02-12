import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { CookieConsentPreferences } from '../../domain/CookieConsent';

@Entity({ name: 'cookie_consents' })
export class CookieConsentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestId: string;

  @Column({ type: 'varchar', length: 50 })
  policyVersion: string;

  @Column({ type: 'varchar', length: 10 })
  locale: string;

  @Column({ type: 'varchar', length: 20 })
  region: string;

  @Column({ type: 'varchar', length: 20 })
  source: string;

  @Column({ type: 'varchar', length: 30 })
  action: string;

  @Column({ type: 'jsonb' })
  preferences: CookieConsentPreferences;

  @Column({ type: 'inet', nullable: true })
  ip?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  referer?: string;

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
