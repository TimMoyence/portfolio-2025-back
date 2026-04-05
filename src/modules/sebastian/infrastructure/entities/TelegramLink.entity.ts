import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Entite TypeORM pour la table telegram_links. */
@Entity({ name: 'telegram_links' })
export class TelegramLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'telegram_user_id', type: 'bigint', unique: true })
  telegramUserId: string; // bigint returned as string by TypeORM/pg

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @CreateDateColumn({ name: 'linked_at' })
  linkedAt: Date;
}
