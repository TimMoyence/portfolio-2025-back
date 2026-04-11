import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { InteractionProfile } from '../../domain/InteractionProfile';

@Entity({ name: 'lead_magnet_requests' })
export class LeadMagnetRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  firstName: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'formation_slug', type: 'varchar', length: 100 })
  formationSlug: string;

  @Column({ name: 'terms_version', type: 'varchar', length: 50 })
  termsVersion: string;

  @Column({ name: 'terms_locale', type: 'varchar', length: 10 })
  termsLocale: string;

  @Column({ name: 'terms_accepted_at', type: 'timestamptz' })
  termsAcceptedAt: Date;

  @Index('idx_lead_magnet_requests_access_token', { unique: true })
  @Column({
    name: 'access_token',
    type: 'uuid',
    generated: 'uuid',
    nullable: true,
  })
  accessToken: string;

  @Column({ type: 'jsonb', default: '{}' })
  profile: InteractionProfile;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;
}
