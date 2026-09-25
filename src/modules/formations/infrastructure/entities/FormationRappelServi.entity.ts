import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { SuiviDuParticipant } from './ligne-de-participant';

@Entity({ name: 'formation_rappels_servis' })
@Index('idx_formation_rappels_servis_session', ['sessionId'])
export class FormationRappelServiEntity extends SuiviDuParticipant(
  'formation_rappels_servis',
) {
  @PrimaryColumn({ name: 'question_id', type: 'varchar', length: 60 })
  questionId: string;

  @Column({ type: 'smallint' })
  rang: number;

  @CreateDateColumn({ name: 'servi_le', type: 'timestamptz' })
  serviLe: Date;
}
