import { ColonnesDeRequete } from '../../../../common/infrastructure/typeorm/ColonnesDeProvenance';
import { Column, Entity } from 'typeorm';
import type { CookieConsentPreferences } from '../../domain/CookieConsent';

@Entity({ name: 'cookie_consents' })
export class CookieConsentEntity extends ColonnesDeRequete {
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
