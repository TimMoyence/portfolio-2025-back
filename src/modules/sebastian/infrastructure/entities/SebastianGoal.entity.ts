import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Entite TypeORM pour la table sebastian_goals. */
@Entity({ name: 'sebastian_goals' })
export class SebastianGoalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  category: string;

  @Column({ name: 'target_quantity', type: 'decimal', precision: 10, scale: 2 })
  targetQuantity: number;

  @Column({ type: 'varchar', length: 20 })
  period: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
