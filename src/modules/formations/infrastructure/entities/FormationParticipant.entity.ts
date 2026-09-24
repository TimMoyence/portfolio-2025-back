import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FormationSessionEntity } from './FormationSession.entity';

@Entity({ name: 'formation_participants' })
@Index('uq_formation_participants_session_key', ['sessionId', 'studentKey'], {
  unique: true,
  where: '"evince_le" IS NULL',
})
@Index('uq_formation_participants_session_seed', ['sessionId', 'seed'], {
  unique: true,
  where: '"evince_le" IS NULL',
})
@Index('idx_formation_participants_student_key', ['studentKey'])
export class FormationParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => FormationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'FK_formation_participants_session',
  })
  session: FormationSessionEntity;

  @Column({ name: 'student_key', type: 'varchar', length: 64 })
  studentKey: string;

  @Column({ type: 'varchar', length: 80 })
  prenom: string;

  @Column({ type: 'varchar', length: 80 })
  nom: string;

  @Column({ type: 'varchar', length: 180 })
  email: string;

  @Column({ type: 'int' })
  seed: number;

  @CreateDateColumn({ name: 'rejoint_le', type: 'timestamptz' })
  rejointLe: Date;

  @Column({ name: 'dernier_ping', type: 'timestamptz', default: () => 'now()' })
  dernierPing: Date;

  @Column({ name: 'evince_le', type: 'timestamptz', nullable: true })
  evinceLe: Date | null;
}
