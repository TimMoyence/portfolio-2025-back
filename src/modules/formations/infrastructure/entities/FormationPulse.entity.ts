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
import type { EtatPulse } from '../../domain/contrats/pilotage';
import { FormationSessionEntity } from './FormationSession.entity';

@Entity({ name: 'formation_pulses' })
@Unique('UQ_formation_pulses_participant_sondage', [
  'sessionId',
  'cleParticipant',
  'sondageId',
])
@Index('idx_formation_pulses_session_sondage', ['sessionId', 'sondageId'])
@Check('CHK_formation_pulses_etat', `"etat" IN ('perdu', 'ca-va', 'clair')`)
export class FormationPulseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => FormationSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'FK_formation_pulses_session',
  })
  session: FormationSessionEntity;

  @Column({ name: 'cle_participant', type: 'char', length: 64 })
  cleParticipant: string;

  @Column({ name: 'sondage_id', type: 'varchar', length: 60 })
  sondageId: string;

  @Column({ type: 'varchar', length: 8 })
  etat: EtatPulse;

  @Column({ name: 'maj_le', type: 'timestamptz', default: () => 'now()' })
  majLe: Date;
}
