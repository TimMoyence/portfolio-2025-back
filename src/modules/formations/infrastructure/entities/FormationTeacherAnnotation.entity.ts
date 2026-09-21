import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { FormationSessionEntity } from './FormationSession.entity';

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
@Check('CHK_formation_teacher_annotations_note', 'length(btrim("note")) > 0')
export class FormationTeacherAnnotationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => FormationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'FK_formation_teacher_annotations_session',
  })
  session: FormationSessionEntity;

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
