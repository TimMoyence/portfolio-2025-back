import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ReferenceArticle } from './reference-article';

export type StatutDeDiffusion = 'scheduled' | 'sent';

@Entity({ name: 'article_broadcasts' })
@Unique('UQ_article_broadcast_article', ['articleRecordId'])
@Index('idx_article_broadcasts_due', ['status', 'sendAfter'])
export class ArticleBroadcastEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ReferenceArticle('FK_article_broadcast_article', 'CASCADE')
  articleRecordId: string;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: StatutDeDiffusion;

  @Column({ name: 'send_after', type: 'timestamp with time zone' })
  sendAfter: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
