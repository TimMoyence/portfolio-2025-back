import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { FormationParticipantEntity } from './FormationParticipant.entity';
import { RelieeAuParticipant } from './ligne-de-participant';

@Entity({ name: 'formation_incidents' })
@Index('idx_formation_incidents_session', ['sessionId'])
export class FormationIncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @RelieeAuParticipant('formation_incidents')
  participant: FormationParticipantEntity;

  @Column({ type: 'varchar', length: 40 })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  contexte: Record<string, unknown> | null;

  @Column({ type: 'timestamptz' })
  horodatage: Date;
}
