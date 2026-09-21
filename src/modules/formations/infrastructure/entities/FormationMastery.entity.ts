import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { Boite } from '../../domain/LeitnerBox';

@Entity({ name: 'formation_mastery' })
@Index('idx_formation_mastery_derniere_vue', ['derniereVue'])
export class FormationMasteryEntity {
  @PrimaryColumn({ name: 'student_key', type: 'varchar', length: 64 })
  studentKey: string;

  @PrimaryColumn({ type: 'varchar', length: 80 })
  concept: string;

  @Column({ type: 'int', default: 1 })
  boite: Boite;

  @Column({ name: 'derniere_vue', type: 'timestamptz', default: () => 'now()' })
  derniereVue: Date;

  @Column({ type: 'int', default: 0 })
  succes: number;

  @Column({ type: 'int', default: 0 })
  echecs: number;
}
