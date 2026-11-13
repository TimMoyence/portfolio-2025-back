import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { ColonneDeLangue } from '../../../../common/infrastructure/typeorm/colonnes/ColonneDeLangue';

@Entity({ name: 'newsletter_confirmations' })
export class LienDeConfirmationEntity {
  @PrimaryColumn({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash: string;

  @Index('idx_newsletter_confirmations_boite')
  @Column({ type: 'text' })
  boite: string;

  @ColonneDeLangue()
  locale: SupportedLocale;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
