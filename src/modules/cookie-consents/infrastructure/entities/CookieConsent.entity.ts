import { ColonnesDeProvenance } from '../../../../common/infrastructure/typeorm/ColonnesDeProvenance';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { CookieConsentPreferences } from '../../domain/CookieConsent';

@Entity({ name: 'cookie_consents' })
export class CookieConsentEntity extends ColonnesDeProvenance {
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
}
