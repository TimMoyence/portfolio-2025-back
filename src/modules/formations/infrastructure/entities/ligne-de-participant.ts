import { Column, PrimaryColumn } from 'typeorm';
import { FormationParticipantEntity } from './FormationParticipant.entity';
import { FormationSessionEntity } from './FormationSession.entity';
import { LigneDeSeance, RelieeALaSeance } from './ligne-de-seance';
import { relationEnCascade } from './relation-en-cascade';

export function RelieeAuParticipant(table: string): PropertyDecorator {
  return relationEnCascade(
    () => FormationParticipantEntity,
    'participant_id',
    `FK_${table}_participant`,
  );
}

export function LigneDeParticipant(table: string) {
  abstract class Ligne extends LigneDeSeance(table) {
    @Column({ name: 'participant_id', type: 'uuid' })
    participantId: string;

    @RelieeAuParticipant(table)
    participant: FormationParticipantEntity;
  }
  return Ligne;
}

export function SuiviDuParticipant(table: string) {
  abstract class Suivi {
    @PrimaryColumn({ name: 'participant_id', type: 'uuid' })
    participantId: string;

    @RelieeAuParticipant(table)
    participant: FormationParticipantEntity;

    @Column({ name: 'session_id', type: 'uuid' })
    sessionId: string;

    @RelieeALaSeance(table)
    session: FormationSessionEntity;
  }
  return Suivi;
}
