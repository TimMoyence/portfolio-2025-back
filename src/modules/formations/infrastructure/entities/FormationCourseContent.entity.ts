import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
} from 'typeorm';
import { ContenuDeCours } from './contenu-de-cours';
import { FormationScreenContentEntity } from './FormationScreenContent.entity';

@Entity({ name: 'formation_course_contents' })
@Index('uq_formation_course_slug_version', ['slug', 'version'], {
  unique: true,
})
@Check('chk_formation_course_version_positive', '"version" > 0')
export class FormationCourseContentEntity extends ContenuDeCours {
  @Column({ type: 'varchar', length: 120 })
  slug: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', length: 180 })
  titre: string;

  @Column({ type: 'varchar', length: 20 })
  niveau: string;

  @Column({ type: 'jsonb', default: {} })
  remediations: Readonly<Record<string, unknown>>;

  @Column({ type: 'jsonb', default: [] })
  medias: readonly unknown[];

  @Column({ type: 'char', length: 64, nullable: true })
  empreinte: string | null;

  @OneToMany(() => FormationScreenContentEntity, (screen) => screen.course)
  ecrans: FormationScreenContentEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
