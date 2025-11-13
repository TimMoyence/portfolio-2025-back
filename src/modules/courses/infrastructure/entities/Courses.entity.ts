import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CoursesTranslationEntity } from './CoursesTranslation.entity';

@Entity({ name: 'courses' })
export class CoursesEntity {
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
