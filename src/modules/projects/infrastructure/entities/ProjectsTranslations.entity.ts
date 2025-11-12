import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ProjectsEntity } from './Projects.entity';

@Entity('project_translation')
@Unique('uq_project_locale', ['projectId', 'locale'])
@Unique('uq_locale_slug', ['locale', 'slug'])
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

  @Column({ type: 'text' })
  locale: string; // 'fr' | 'en'

  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  shortDescription?: string;

  @Column({ type: 'text', nullable: true })
  longDescription?: string;
}
