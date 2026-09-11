import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'formation_participants' })
export class FormationParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'student_key', type: 'uuid' })
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
}
