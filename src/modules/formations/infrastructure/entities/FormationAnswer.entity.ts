import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { AnswerValue } from '../../domain/AnswerGrading';

@Entity({ name: 'formation_answers' })
export class FormationAnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @Column({ name: 'question_id', type: 'varchar', length: 60 })
  questionId: string;

  @Column({ type: 'varchar', length: 80 })
  concept: string;

  @Column({ type: 'jsonb' })
  valeur: AnswerValue;

  @Column({ type: 'int' })
  seed: number;

  @Column({ type: 'boolean' })
  correcte: boolean;

  @Column({ type: 'varchar', length: 120, nullable: true })
  misconception: string | null;

  @Column({ name: 'duree_ms', type: 'int' })
  dureeMs: number;

  @CreateDateColumn({ name: 'soumis_le', type: 'timestamptz' })
  soumisLe: Date;
}
