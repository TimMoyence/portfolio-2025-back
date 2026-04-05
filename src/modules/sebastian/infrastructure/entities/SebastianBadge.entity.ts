import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersEntity } from '../../../users/infrastructure/entities/Users.entity';

/** Entite TypeORM pour la table sebastian_badges. */
@Entity({ name: 'sebastian_badges' })
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
  @JoinColumn({ name: 'user_id' })
  user: UsersEntity;
}
