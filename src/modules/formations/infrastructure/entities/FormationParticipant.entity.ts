import { LigneDeSeance } from './ligne-de-seance';
import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

@Entity({ name: 'formation_participants' })
@Index('uq_formation_participants_session_key', ['sessionId', 'studentKey'], {
  unique: true,
  where: '"evince_le" IS NULL',
})
@Index('uq_formation_participants_session_seed', ['sessionId', 'seed'], {
  unique: true,
  where: '"evince_le" IS NULL',
})
@Index('idx_formation_participants_student_key', ['studentKey'])
export class FormationParticipantEntity extends LigneDeSeance(
  'formation_participants',
) {
  @Column({ name: 'student_key', type: 'varchar', length: 64 })
  studentKey: string;

  @Column({ type: 'varchar', length: 80 })
  prenom: string;

  @Column({ type: 'varchar', length: 80 })
  nom: string;

  @Column({ type: 'varchar', length: 180 })
  email: string;

  @Column({ type: 'int' })
  seed: number;

  @CreateDateColumn({ name: 'rejoint_le', type: 'timestamptz' })
  rejointLe: Date;

  @Column({ name: 'dernier_ping', type: 'timestamptz', default: () => 'now()' })
  dernierPing: Date;

  @Column({ name: 'evince_le', type: 'timestamptz', nullable: true })
  evinceLe: Date | null;

  @Column({
    name: 'empreinte_de_reprise',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  empreinteDeReprise: string | null;

  @Column({ name: 'generation_de_jeton', type: 'int', default: 0 })
  generationDeJeton: number;
}
