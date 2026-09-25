import { Column, PrimaryGeneratedColumn } from 'typeorm';
import { FormationSessionEntity } from './FormationSession.entity';
import { relationEnCascade } from './relation-en-cascade';

export function RelieeALaSeance(table: string): PropertyDecorator {
  return relationEnCascade(
    () => FormationSessionEntity,
    'session_id',
    `FK_${table}_session`,
  );
}

export function LigneDeSeance(table: string) {
  abstract class Ligne {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'session_id', type: 'uuid' })
    sessionId: string;

    @RelieeALaSeance(table)
    session: FormationSessionEntity;
  }
  return Ligne;
}
