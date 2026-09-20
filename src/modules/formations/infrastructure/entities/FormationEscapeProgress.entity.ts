import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { FormationParticipantEntity } from './FormationParticipant.entity';
import { FormationSessionEntity } from './FormationSession.entity';

@Entity({ name: 'formation_escape_progress' })
@Check(
  'CHK_formation_escape_progress_tentatives',
  '"tentatives" BETWEEN 0 AND 10',
)
@Index('idx_formation_escape_progress_session', ['sessionId', 'parcoursId'])
export class FormationEscapeProgressEntity {
  @PrimaryColumn({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @PrimaryColumn({ name: 'enigme_id', type: 'varchar', length: 60 })
  enigmeId: string;

  @ManyToOne(() => FormationParticipantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'participant_id',
    foreignKeyConstraintName: 'FK_formation_escape_progress_participant',
  })
  participant: FormationParticipantEntity;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => FormationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'FK_formation_escape_progress_session',
  })
  session: FormationSessionEntity;

  @Column({ name: 'parcours_id', type: 'varchar', length: 60 })
  parcoursId: string;

  @Column({ type: 'int', default: 0 })
  tentatives: number;

  @Column({ name: 'resolue_le', type: 'timestamptz', nullable: true })
  resolueLe: Date | null;
}
