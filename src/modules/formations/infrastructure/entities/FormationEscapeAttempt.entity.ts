import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FormationParticipantEntity } from './FormationParticipant.entity';
import { FormationSessionEntity } from './FormationSession.entity';

@Entity({ name: 'formation_escape_attempts' })
@Index('idx_formation_escape_attempts_participant', [
  'participantId',
  'enigmeId',
])
export class FormationEscapeAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => FormationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'FK_formation_escape_attempts_session',
  })
  session: FormationSessionEntity;

  @Column({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @ManyToOne(() => FormationParticipantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'participant_id',
    foreignKeyConstraintName: 'FK_formation_escape_attempts_participant',
  })
  participant: FormationParticipantEntity;

  @Column({ name: 'enigme_id', type: 'varchar', length: 60 })
  enigmeId: string;

  @Column({
    name: 'valeur_normalisee',
    type: 'numeric',
    nullable: true,
    transformer: {
      to: (valeur: number | null) => valeur,
      from: (valeur: string | null) =>
        valeur === null ? null : Number(valeur),
    },
  })
  valeurNormalisee: number | null;

  @Column({ type: 'varchar', length: 40 })
  saisie: string;

  @Column({ type: 'boolean' })
  correcte: boolean;

  @CreateDateColumn({ name: 'soumis_le', type: 'timestamptz' })
  soumisLe: Date;
}
