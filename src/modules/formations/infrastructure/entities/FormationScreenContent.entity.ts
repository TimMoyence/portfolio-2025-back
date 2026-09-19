import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FormationCourseContentEntity } from './FormationCourseContent.entity';

@Entity({ name: 'formation_screen_contents' })
@Check('chk_formation_screen_notes_not_blank', 'length(btrim("notes")) > 0')
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
export class FormationScreenContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => FormationCourseContentEntity, (course) => course.ecrans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: FormationCourseContentEntity;

  @Column({ type: 'int' })
  position: number;

  @Column({ name: 'screen_id', type: 'varchar', length: 120 })
  screenId: string;

  @Column({ type: 'varchar', length: 40 })
  brique: string;

  @Column({ name: 'duree_minutes', type: 'int' })
  dureeMinutes: number;

  @Column({ type: 'jsonb' })
  concepts: readonly string[];

  @Column({ type: 'text', default: '' })
  notes: string;

  @Column({ type: 'jsonb' })
  proprietes: Readonly<Record<string, unknown>>;
}
