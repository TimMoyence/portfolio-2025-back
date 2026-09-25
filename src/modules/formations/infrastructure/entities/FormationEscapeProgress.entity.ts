import { Check, Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { SuiviDuParticipant } from './ligne-de-participant';

@Entity({ name: 'formation_escape_progress' })
@Check(
  'CHK_formation_escape_progress_tentatives',
  '"tentatives" BETWEEN 0 AND 10',
)
@Index('idx_formation_escape_progress_session', ['sessionId', 'parcoursId'])
export class FormationEscapeProgressEntity extends SuiviDuParticipant(
  'formation_escape_progress',
) {
  @PrimaryColumn({ name: 'enigme_id', type: 'varchar', length: 60 })
  enigmeId: string;

  @Column({ name: 'parcours_id', type: 'varchar', length: 60 })
  parcoursId: string;

  @Column({ type: 'int', default: 0 })
  tentatives: number;

  @Column({ name: 'resolue_le', type: 'timestamptz', nullable: true })
  resolueLe: Date | null;
}
