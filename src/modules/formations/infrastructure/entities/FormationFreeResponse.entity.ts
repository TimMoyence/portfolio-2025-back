import { LigneDeSeance } from './ligne-de-seance';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import type { FreeResponseStatus } from '../../domain/IFreeResponses.repository';
import { FormationParticipantEntity } from './FormationParticipant.entity';

@Entity({ name: 'formation_free_responses' })
@Unique('UQ_formation_free_responses_participant_activity', [
  'sessionId',
  'participantId',
  'activityId',
])
@Index('idx_formation_free_responses_session_screen', ['sessionId', 'screenId'])
@Check(
  'CHK_formation_free_responses_status',
  `"status" IN ('enregistre', 'en_attente', 'echec')`,
)
@Check('CHK_formation_free_responses_duration', '"duree_ms" >= 0')
export class FormationFreeResponseEntity extends LigneDeSeance(
  'formation_free_responses',
) {
  @Column({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @ManyToOne(() => FormationParticipantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'participant_id',
    foreignKeyConstraintName: 'FK_formation_free_responses_participant',
  })
  participant: FormationParticipantEntity;

  @Column({ name: 'screen_id', type: 'varchar', length: 120 })
  screenId: string;

  @Column({ name: 'activity_id', type: 'varchar', length: 120 })
  activityId: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ name: 'premiere_reponse', type: 'text', nullable: true })
  premiereReponse: string | null;

  @Column({
    name: 'strategies_servies_le',
    type: 'timestamptz',
    nullable: true,
  })
  strategiesServiesLe: Date | null;

  @Column({ name: 'duree_ms', type: 'int' })
  dureeMs: number;

  @Column({ type: 'varchar', length: 20, default: 'enregistre' })
  status: FreeResponseStatus;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt: Date;
}
