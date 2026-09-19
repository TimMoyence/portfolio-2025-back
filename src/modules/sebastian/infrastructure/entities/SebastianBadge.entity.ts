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
import { UsersEntity } from '../../../users/infrastructure/entities/Users.entity';

@Entity({ name: 'sebastian_badges' })
@Unique('uq_sebastian_badges_user_key', ['userId', 'badgeKey'])
@Index('idx_sebastian_badges_user', ['userId'])
@Check(
  'sebastian_badges_category_check',
  `"category" IN ('alcohol', 'coffee', 'global')`,
)
export class SebastianBadgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'badge_key', type: 'varchar', length: 50 })
  badgeKey: string;

  @Column({ type: 'varchar', length: 20 })
  category: string;

  @Column({
    name: 'unlocked_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  unlockedAt: Date;

  @ManyToOne(() => UsersEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'sebastian_badges_user_id_fkey',
  })
  user: UsersEntity;
}
