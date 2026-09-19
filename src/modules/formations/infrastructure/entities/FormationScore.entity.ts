import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
  Check,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { FormationParticipantEntity } from './FormationParticipant.entity';
import { FormationSessionEntity } from './FormationSession.entity';

@Entity({ name: 'formation_scores' })
@Check('CHK_formation_scores_kind', "\"kind\" IN ('individual', 'session')")
@Unique('UQ_formation_scores_session_participant_kind', [
  'sessionId',
  'participantId',
  'kind',
])
@Index('UQ_formation_scores_session_kind_session', ['sessionId', 'kind'], {
  unique: true,
  where: '"participant_id" IS NULL',
})
@Index('idx_formation_scores_session', ['sessionId'])
export class FormationScoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => FormationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'FK_formation_scores_session',
  })
  session: FormationSessionEntity;

  @Column({ name: 'participant_id', type: 'uuid', nullable: true })
  participantId: string | null;

  @ManyToOne(() => FormationParticipantEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'participant_id',
    foreignKeyConstraintName: 'FK_formation_scores_participant',
  })
  participant: FormationParticipantEntity | null;

  @Column({ type: 'varchar', length: 20 })
  kind: 'individual' | 'session';

  @Column({ type: 'double precision' })
  score: number;

  @Column({ type: 'double precision' })
  percentage: number;

  @Column({ type: 'jsonb' })
  metrics: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
