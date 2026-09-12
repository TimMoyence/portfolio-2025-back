import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FormationParticipantEntity } from './FormationParticipant.entity';

@Entity({ name: 'formation_incidents' })
@Index('idx_formation_incidents_session', ['sessionId'])
export class FormationIncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @ManyToOne(() => FormationParticipantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'participant_id',
    foreignKeyConstraintName: 'FK_formation_incidents_participant',
  })
  participant: FormationParticipantEntity;

  @Column({ type: 'varchar', length: 40 })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  contexte: Record<string, unknown> | null;

  @Column({ type: 'timestamptz' })
  horodatage: Date;
}
