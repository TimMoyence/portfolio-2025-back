import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectType } from '../enums/ProjectType.enum';
import { PublishStatus } from '../enums/PublishStatus.enum';
import { ProjectsTranslationsEntity } from './ProjectsTranslations.entity';

@Entity({ name: 'projects' })
export class ProjectsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'enum', enum: ProjectType, default: ProjectType.SIDE })
  type: ProjectType;

  @Column({ type: 'text', nullable: true })
  repoUrl?: string;

  @Column({ type: 'text', nullable: true })
  liveUrl?: string;

  @Column({ type: 'text', nullable: true })
  coverImage?: string;

  @Column({ type: 'text', array: true, nullable: true })
  gallery?: string[];

  @Column({ type: 'jsonb', default: () => `jsonb_build_array()` })
  stack: string[];

  @Column({
    type: 'enum',
    enum: PublishStatus,
    default: PublishStatus.PUBLISHED,
  })
  status: PublishStatus;

  @OneToMany(() => ProjectsTranslationsEntity, (t) => t.project, {
    cascade: true,
  })
  translations: ProjectsTranslationsEntity[];

  @Column({ type: 'int', default: 0 })
  'order': number;

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
