import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ArticleEntity } from './article.entity';

@Entity({ name: 'article_deliveries' })
@Unique('UQ_article_delivery_delivery', ['deliveryId'])
@Unique('UQ_article_delivery_idempotency', ['idempotencyKey'])
@Unique('UQ_article_delivery_nonce', ['nonce'])
export class ArticleDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128 })
  deliveryId: string;

  @Column({ type: 'varchar', length: 160 })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 128 })
  nonce: string;

  @ForeignKey(() => ArticleEntity, {
    name: 'FK_article_delivery_article',
    onDelete: 'RESTRICT',
  })
  @Column({ type: 'uuid' })
  articleRecordId: string;

  @Column({ type: 'varchar', length: 20, default: 'accepted' })
  status: 'accepted';

  @Column({ type: 'integer', default: 1 })
  attempts: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'received_at', type: 'timestamp with time zone' })
  receivedAt: Date;
}
