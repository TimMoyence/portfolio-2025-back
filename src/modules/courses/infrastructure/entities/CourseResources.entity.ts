import { ColonnesDeTrace } from '../../../../common/infrastructure/typeorm/ColonnesDeTrace';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ResourceKind } from '../enums/ResourceKind.enum';
import { CoursesEntity } from './Courses.entity';

@Entity('course_resource')
export class CourseResourceEntity extends ColonnesDeTrace {
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
}
