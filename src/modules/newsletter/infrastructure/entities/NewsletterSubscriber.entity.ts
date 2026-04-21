import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { SubscriptionStatus } from '../../domain/SubscriptionStatus';

/**
 * Entite TypeORM de `newsletter_subscribers`. Contraintes :
 *  - unicite metier (email, source_formation_slug) — un email peut
 *    s'abonner a plusieurs formations distinctes,
 *  - tokens confirm/unsubscribe indexes uniques pour la lecture par
 *    token (endpoints /confirm, /unsubscribe),
 *  - status indexe pour le planificateur drip (filtre `confirmed`).
 */
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

  @Column({ name: 'terms_version', type: 'varchar', length: 50 })
  termsVersion: string;

  @Column({ name: 'terms_accepted_at', type: 'timestamptz' })
  termsAcceptedAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'unsubscribed_at', type: 'timestamptz', nullable: true })
  unsubscribedAt: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;
}
