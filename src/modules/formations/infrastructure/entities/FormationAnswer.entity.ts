import { Column, CreateDateColumn, Entity, Index, Unique } from 'typeorm';
import type {
  DetailProduction,
  ValeurReponse,
} from '../../domain/contrats/resultats';
import { LigneDeParticipant } from './ligne-de-participant';

@Entity({ name: 'formation_answers' })
@Unique('UQ_formation_answers_participant_question', [
  'participantId',
  'questionId',
])
@Index('idx_formation_answers_session_question', ['sessionId', 'questionId'])
export class FormationAnswerEntity extends LigneDeParticipant(
  'formation_answers',
) {
  @Column({ name: 'question_id', type: 'varchar', length: 60 })
  questionId: string;

  @Column({ type: 'varchar', length: 80 })
  concept: string;

  @Column({ type: 'jsonb' })
  valeur: ValeurReponse;

  @Column({ type: 'int' })
  seed: number;

  @Column({ type: 'boolean' })
  correcte: boolean;

  @Column({ type: 'varchar', length: 120, nullable: true })
  misconception: string | null;

  @Column({ type: 'real', nullable: true })
  score: number | null;

  @Column({ type: 'jsonb', nullable: true })
  details: readonly DetailProduction[] | null;

  @Column({ name: 'duree_ms', type: 'int' })
  dureeMs: number;

  @Column({ type: 'int', default: 1 })
  soumissions: number;

  @CreateDateColumn({ name: 'soumis_le', type: 'timestamptz' })
  soumisLe: Date;
}
