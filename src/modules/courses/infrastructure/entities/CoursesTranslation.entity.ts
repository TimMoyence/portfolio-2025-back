import { TraductionDeContenu } from '../../../../common/infrastructure/typeorm/ColonnesDeContenu';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CoursesEntity } from './Courses.entity';

@Entity({ name: 'courses_translation' })
@Unique('uq_courses_translation_locale', ['courseId', 'locale'])
@Unique('uq_courses_translation_locale_slug', ['locale', 'slug'])
export class CoursesTranslationEntity extends TraductionDeContenu {
  @Column('uuid')
  courseId: string;

  @ManyToOne(() => CoursesEntity, (course) => course.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: CoursesEntity;

  @Column('text')
  title: string;

  @Column('text')
  summary: string;
}
