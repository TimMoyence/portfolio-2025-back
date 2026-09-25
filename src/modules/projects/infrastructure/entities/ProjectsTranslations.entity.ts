import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import {
  ColonneLocale,
  SlugDeTraduction,
} from '../../../../common/infrastructure/typeorm/ColonnesDeContenu';
import { ProjectsEntity } from './Projects.entity';

@Entity({ name: 'project_translation' })
@Unique('uq_project_translation_locale', ['projectId', 'locale'])
@Unique('uq_project_translation_locale_slug', ['locale', 'slug'])
export class ProjectsTranslationsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProjectsEntity, (p) => p.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: ProjectsEntity;

  @Column('uuid')
  projectId: string;

  @ColonneLocale()
  locale: string;

  @SlugDeTraduction()
  slug: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  shortDescription?: string;

  @Column({ type: 'text', nullable: true })
  longDescription?: string;
}
