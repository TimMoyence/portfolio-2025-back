import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  Unique,
} from 'typeorm';
import { LigneDeParticipant } from './ligne-de-participant';

@Entity({ name: 'formation_free_responses' })
@Unique('UQ_formation_free_responses_participant_activity', [
  'sessionId',
  'participantId',
  'activityId',
])
@Index('idx_formation_free_responses_session_screen', ['sessionId', 'screenId'])
@Check('CHK_formation_free_responses_duration', '"duree_ms" >= 0')
export class FormationFreeResponseEntity extends LigneDeParticipant(
  'formation_free_responses',
) {
  @Column({ name: 'screen_id', type: 'varchar', length: 120 })
  screenId: string;

  @Column({ name: 'activity_id', type: 'varchar', length: 120 })
  activityId: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ name: 'premiere_reponse', type: 'text', nullable: true })
  premiereReponse: string | null;

  @Column({ name: 'duree_ms', type: 'int' })
  dureeMs: number;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt: Date;
}
