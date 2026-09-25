import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ContenuDeCours } from './contenu-de-cours';
import { FormationCourseContentEntity } from './FormationCourseContent.entity';

@Entity({ name: 'formation_screen_contents' })
@Check(
  'chk_formation_screen_notes_absentes_ou_renseignees',
  `"notes" = '' OR "notes" ~ '[^[:space:]]'`,
)
@Check(
  'chk_formation_screen_diffusion',
  `"diffusion" IN ('catalogue', 'seance')`,
)
@Index('uq_formation_screen_course_screen_id', ['courseId', 'screenId'], {
  unique: true,
})
@Index(
  'uq_formation_screen_contents_course_position',
  ['courseId', 'position'],
  {
    unique: true,
  },
)
export class FormationScreenContentEntity extends ContenuDeCours {
  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => FormationCourseContentEntity, (course) => course.ecrans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'course_id',
    foreignKeyConstraintName: 'FK_formation_screen_contents_course',
  })
  course: FormationCourseContentEntity;

  @Column({ type: 'int' })
  position: number;

  @Column({ name: 'screen_id', type: 'varchar', length: 120 })
  screenId: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  titre: string | null;

  @Column({ type: 'varchar', length: 10, default: 'seance' })
  diffusion: string;

  @Column({ type: 'varchar', length: 40 })
  brique: string;

  @Column({ type: 'text' })
  notes: string;

  @Column({ type: 'jsonb' })
  proprietes: Readonly<Record<string, unknown>>;
}
