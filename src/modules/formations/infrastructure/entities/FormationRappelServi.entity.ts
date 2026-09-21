import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { FormationParticipantEntity } from './FormationParticipant.entity';
import { FormationSessionEntity } from './FormationSession.entity';

@Entity({ name: 'formation_rappels_servis' })
@Index('idx_formation_rappels_servis_session', ['sessionId'])
export class FormationRappelServiEntity {
  @PrimaryColumn({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @PrimaryColumn({ name: 'question_id', type: 'varchar', length: 60 })
  questionId: string;

  @ManyToOne(() => FormationParticipantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'participant_id',
    foreignKeyConstraintName: 'FK_formation_rappels_servis_participant',
  })
  participant: FormationParticipantEntity;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => FormationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'FK_formation_rappels_servis_session',
  })
  session: FormationSessionEntity;

  @Column({ type: 'smallint' })
  rang: number;

  @CreateDateColumn({ name: 'servi_le', type: 'timestamptz' })
  serviLe: Date;
}
