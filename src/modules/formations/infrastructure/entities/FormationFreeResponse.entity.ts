import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { FreeResponseStatus } from '../../domain/IFreeResponses.repository';

@Entity({ name: 'formation_free_responses' })
@Unique('UQ_formation_free_responses_participant_activity', [
  'sessionId',
  'participantId',
  'activityId',
])
@Index('idx_formation_free_responses_session_screen', ['sessionId', 'screenId'])
export class FormationFreeResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @Column({ name: 'screen_id', type: 'varchar', length: 120 })
  screenId: string;

  @Column({ name: 'activity_id', type: 'varchar', length: 120 })
  activityId: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ name: 'duree_ms', type: 'int' })
  dureeMs: number;

  @Column({ type: 'varchar', length: 20, default: 'enregistre' })
  status: FreeResponseStatus;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt: Date;
}
