import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CoursesEntity } from './Courses.entity';

@Entity({ name: 'courses_translation' })
@Unique('uq_courses_translation_locale', ['courseId', 'locale'])
@Unique('uq_courses_translation_locale_slug', ['locale', 'slug'])
export class CoursesTranslationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @ManyToOne(() => CoursesEntity, (course) => course.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: CoursesEntity;

  @Column('text')
  locale: string;

  @Index()
  @Column('text')
  slug: string;

  @Column('text')
  title: string;

  @Column('text')
  summary: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({
    name: 'updated_or_created_by',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  updatedOrCreatedBy: string | null;
}
