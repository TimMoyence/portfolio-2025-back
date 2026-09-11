import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'article_deliveries' })
export class ArticleDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  deliveryId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  idempotencyKey: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  nonce: string;

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
