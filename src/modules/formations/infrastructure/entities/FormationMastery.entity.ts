import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { Boite } from '../../domain/LeitnerBox';

@Entity({ name: 'formation_mastery' })
export class FormationMasteryEntity {
  @PrimaryColumn({ name: 'student_key', type: 'varchar', length: 64 })
  studentKey: string;

  @PrimaryColumn({ type: 'varchar', length: 80 })
  concept: string;

  @Column({ type: 'int', default: 1 })
  boite: Boite;

  @Column({ type: 'int', default: 0 })
  succes: number;

  @Column({ type: 'int', default: 0 })
  echecs: number;
}
