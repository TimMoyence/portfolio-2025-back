import { Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FormationSessionEntity } from './FormationSession.entity';

export function LigneDeSeance(table: string) {
  abstract class Ligne {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'session_id', type: 'uuid' })
    sessionId: string;

    @ManyToOne(() => FormationSessionEntity, { onDelete: 'CASCADE' })
    @JoinColumn({
      name: 'session_id',
      foreignKeyConstraintName: `FK_${table}_session`,
    })
    session: FormationSessionEntity;
  }
  return Ligne;
}
