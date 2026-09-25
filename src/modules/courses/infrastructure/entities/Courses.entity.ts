import { ContenuASlugUnique } from '../../../../common/infrastructure/typeorm/ColonnesDeContenu';
import { Column, Entity, OneToMany } from 'typeorm';
import { CoursesTranslationEntity } from './CoursesTranslation.entity';

@Entity({ name: 'courses' })
export class CoursesEntity extends ContenuASlugUnique {
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
