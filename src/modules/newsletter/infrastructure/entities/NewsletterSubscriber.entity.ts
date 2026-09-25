import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import {
  ColonneAcceptationDesConditions,
  ColonneVersionDesConditions,
} from '../../../../common/infrastructure/typeorm/ColonnesDeConsentement';
import type { SubscriptionStatus } from '../../domain/SubscriptionStatus';

@Entity({ name: 'newsletter_subscribers' })
@Unique('uq_newsletter_email_source', ['email', 'sourceFormationSlug'])
export class NewsletterSubscriberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'first_name', type: 'varchar', length: 50, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 10 })
  locale: string;

  @Column({ name: 'source_formation_slug', type: 'varchar', length: 100 })
  sourceFormationSlug: string;

  @Index('idx_newsletter_status')
  @Column({ type: 'varchar', length: 20 })
  status: SubscriptionStatus;

  @Index('idx_newsletter_confirm_token', { unique: true })
  @Column({ name: 'confirm_token', type: 'uuid' })
  confirmToken: string;

  @Index('idx_newsletter_unsubscribe_token', { unique: true })
  @Column({ name: 'unsubscribe_token', type: 'uuid' })
  unsubscribeToken: string;

  @ColonneVersionDesConditions()
  termsVersion: string;

  @ColonneAcceptationDesConditions()
  termsAcceptedAt: Date;

  @Index('idx_newsletter_confirm_token_expires_at')
  @Column({ name: 'confirm_token_expires_at', type: 'timestamptz' })
  confirmTokenExpiresAt: Date;

  @Column({
    name: 'last_confirmation_sent_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastConfirmationSentAt: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'unsubscribed_at', type: 'timestamptz', nullable: true })
  unsubscribedAt: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;
}
