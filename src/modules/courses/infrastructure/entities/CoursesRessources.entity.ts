import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ResourceKind } from '../enums/ResourceKind.enum';
import { CoursesEntity } from './Courses.entity';

@Entity('course_resource')
export class CourseResourceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CoursesEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: CoursesEntity;

  @Column('uuid')
  courseId: string;

  @Column({ type: 'enum', enum: ResourceKind })
  kind: ResourceKind;

  @Column('text')
  title: string;

  @Column('text')
  url: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'updated_or_created_by', type: 'int', nullable: true })
  updatedOrCreatedBy: number | null;
}
