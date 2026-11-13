import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ArticleBroadcastEntity } from './article-broadcast.entity';

export type StatutDUnDestinataire = 'sending' | 'sent' | 'refused';

@Entity({ name: 'article_broadcast_recipients' })
@Unique('UQ_article_broadcast_recipient', ['broadcastId', 'subscriberId'])
export class ArticleBroadcastRecipientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey(() => ArticleBroadcastEntity, {
    name: 'FK_article_broadcast_recipient_broadcast',
    onDelete: 'CASCADE',
  })
  @Column({ name: 'broadcast_id', type: 'uuid' })
  broadcastId: string;

  @ForeignKey('NewsletterSubscriberEntity', {
    name: 'FK_article_broadcast_recipient_subscriber',
    onDelete: 'CASCADE',
  })
  @Column({ name: 'subscriber_id', type: 'uuid' })
  subscriberId: string;

  @Column({ type: 'varchar', length: 10, default: 'sending' })
  status: StatutDUnDestinataire;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
