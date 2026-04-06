import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Entite TypeORM pour la table sebastian_entries. */
@Entity({ name: 'sebastian_entries' })
export class SebastianEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar', length: 20 })
  unit: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'drink_type', type: 'varchar', length: 20, nullable: true })
  drinkType: string | null;

  @Column({
    name: 'alcohol_degree',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  alcoholDegree: number | null;

  @Column({
    name: 'volume_cl',
    type: 'decimal',
    precision: 6,
    scale: 1,
    nullable: true,
  })
  volumeCl: number | null;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
