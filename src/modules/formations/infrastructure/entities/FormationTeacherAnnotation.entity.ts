import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'formation_teacher_annotations' })
@Unique('UQ_formation_teacher_annotations_session_screen_group', [
  'sessionId',
  'screenId',
  'groupName',
])
@Index('idx_formation_teacher_annotations_session_teacher', [
  'sessionId',
  'teacherId',
])
export class FormationTeacherAnnotationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @Column({ name: 'screen_id', type: 'varchar', length: 120 })
  screenId: string;

  @Column({
    name: 'group_name',
    type: 'varchar',
    length: 120,
    default: 'Classe entière',
  })
  groupName: string;

  @Column({ type: 'text' })
  note: string;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
