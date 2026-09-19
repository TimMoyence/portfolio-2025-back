import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersEntity } from '../../../users/infrastructure/entities/Users.entity';

@Entity({ name: 'sebastian_goals' })
@Index('idx_sebastian_goals_user', ['userId'])
@Index('idx_sebastian_goals_active', ['userId', 'isActive'])
@Check('sebastian_goals_category_check', `"category" IN ('alcohol', 'coffee')`)
@Check('sebastian_goals_target_quantity_check', `"target_quantity" > 0`)
@Check(
  'sebastian_goals_period_check',
  `"period" IN ('daily', 'weekly', 'monthly')`,
)
export class SebastianGoalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey(() => UsersEntity, {
    name: 'sebastian_goals_user_id_fkey',
    onDelete: 'CASCADE',
  })
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
