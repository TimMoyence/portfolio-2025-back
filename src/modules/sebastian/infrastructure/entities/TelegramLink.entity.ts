import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersEntity } from '../../../users/infrastructure/entities/Users.entity';

@Entity({ name: 'telegram_links' })
@Index('idx_telegram_links_user_id', ['userId'])
export class TelegramLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'telegram_user_id', type: 'bigint', unique: true })
  telegramUserId: string; // bigint returned as string by TypeORM/pg

  @ForeignKey(() => UsersEntity, {
    name: 'telegram_links_user_id_fkey',
    onDelete: 'CASCADE',
  })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @CreateDateColumn({ name: 'linked_at' })
  linkedAt: Date;
}
