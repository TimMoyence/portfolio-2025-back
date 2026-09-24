import { ColonnesDeTrace } from '../../../../common/infrastructure/typeorm/ColonnesDeTrace';
import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CoursesTranslationEntity } from './CoursesTranslation.entity';

@Entity({ name: 'courses' })
export class CoursesEntity extends ColonnesDeTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('text')
  slug: string;

  @Column('text')
  title: string;

  @Column('text')
  summary: string;

  @Column({ type: 'text', nullable: true })
  coverImage?: string;

  @OneToMany(
    () => CoursesTranslationEntity,
    (translation) => translation.course,
  )
  translations: CoursesTranslationEntity[];
}
