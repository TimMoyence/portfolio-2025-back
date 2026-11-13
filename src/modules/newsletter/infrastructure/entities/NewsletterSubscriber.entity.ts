import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import { ColonneDeLangue } from '../../../../common/infrastructure/typeorm/colonnes/ColonneDeLangue';
import {
  ColonneAcceptationDesConditions,
  ColonneVersionDesConditions,
} from '../../../../common/infrastructure/typeorm/colonnes/ColonnesDeConsentement';
import type { StatutDAbonnement } from '../../domain/NewsletterSubscriber';

@Entity({ name: 'newsletter_subscribers' })
export class NewsletterSubscriberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'text', unique: true })
  boite: string;

  @ColonneDeLangue()
  locale: SupportedLocale;

  @Column({ type: 'varchar', length: 20 })
  status: StatutDAbonnement;

  @Column({ name: 'unsubscribe_token', type: 'uuid', unique: true })
  unsubscribeToken: string;

  @ColonneVersionDesConditions()
  termsVersion: string;

  @ColonneAcceptationDesConditions()
  termsAcceptedAt: Date;

  @Column({ name: 'last_mail_sent_at', type: 'timestamptz', nullable: true })
  lastMailSentAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
