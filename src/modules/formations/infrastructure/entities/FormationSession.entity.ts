import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Bareme } from '../../domain/Bareme';
import type { FreeRange, PacingMode } from '../../domain/PacingMode';
import type { SessionState } from '../../domain/SessionState';

@Entity({ name: 'formation_sessions' })
@Index('uq_formation_sessions_code_active', ['code'], {
  unique: true,
  where: `"etat" <> 'terminee'`,
})
@Index('idx_formation_sessions_teacher', ['teacherId'])
export class FormationSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_slug', type: 'varchar', length: 120 })
  courseSlug: string;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @Column({ type: 'varchar', length: 4 })
  code: string;

  @Column({ type: 'varchar', length: 20, default: 'attente' })
  etat: SessionState;

  @Column({
    name: 'mode_rythme',
    type: 'varchar',
    length: 10,
    default: 'pilote',
  })
  modeRythme: PacingMode;

  @Column({ name: 'ecran_courant', type: 'int', default: 0 })
  ecranCourant: number;

  @Column({ name: 'intervalle_libre', type: 'jsonb', nullable: true })
  intervalleLibre: FreeRange | null;

  @Column({ type: 'jsonb' })
  bareme: Bareme;

  @CreateDateColumn({ name: 'ouverte_le', type: 'timestamptz' })
  ouverteLe: Date;

  @Column({ name: 'fermee_le', type: 'timestamptz', nullable: true })
  fermeeLe: Date | null;

  @Column({ name: 'maj_le', type: 'timestamptz', default: () => 'now()' })
  majLe: Date;
}
