import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { ArticleBroadcastStatus } from '../../application/article-broadcast.repository';
import { ArticleEntity } from './article.entity';

@Entity({ name: 'article_broadcasts' })
@Unique('UQ_article_broadcast_article', ['articleRecordId'])
@Index('idx_article_broadcasts_due', ['status', 'sendAfter'])
export class ArticleBroadcastEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey(() => ArticleEntity, {
    name: 'FK_article_broadcast_article',
    onDelete: 'CASCADE',
  })
  @Column({ type: 'uuid' })
  articleRecordId: string;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: ArticleBroadcastStatus;

  @Column({ type: 'timestamp with time zone' })
  sendAfter: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lockedUntil: Date | null;

  @Column({ type: 'integer', default: 0 })
  sentCount: number;

  @Column({ type: 'integer', default: 0 })
  failedCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
