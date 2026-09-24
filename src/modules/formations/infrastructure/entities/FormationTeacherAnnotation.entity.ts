import { LigneDeSeance } from './ligne-de-seance';
import { Check, Column, Entity, Index, Unique } from 'typeorm';

@Entity({ name: 'formation_teacher_annotations' })
@Unique('UQ_formation_teacher_annotations_session_screen', [
  'sessionId',
  'screenId',
])
@Index('idx_formation_teacher_annotations_session_teacher', [
  'sessionId',
  'teacherId',
])
@Check('CHK_formation_teacher_annotations_note', 'length(btrim("note")) > 0')
export class FormationTeacherAnnotationEntity extends LigneDeSeance(
  'formation_teacher_annotations',
) {
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @Column({ name: 'screen_id', type: 'varchar', length: 120 })
  screenId: string;

  @Column({ type: 'text' })
  note: string;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
