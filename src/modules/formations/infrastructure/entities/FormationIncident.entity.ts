import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'formation_incidents' })
export class FormationIncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @Column({ type: 'varchar', length: 40 })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  contexte: Record<string, unknown> | null;

  @Column({ type: 'timestamptz' })
  horodatage: Date;
}
