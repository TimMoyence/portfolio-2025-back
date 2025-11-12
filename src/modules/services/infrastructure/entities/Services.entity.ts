import { PublishStatus } from 'src/modules/projects/infrastructure/enums/PublishStatus.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'services' })
export class ServicesEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Index({ unique: true })
  @Column('text')
  slug: string;

  @Column('text')
  name: string;

  @Column('text')
  excerpt: string;

  @Column('text')
  content: string;

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @Column({
    type: 'enum',
    enum: PublishStatus,
    default: PublishStatus.PUBLISHED,
  })
  status: PublishStatus;

  @Column({ type: 'int', default: 0 }) order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'updated_or_created_by', type: 'int', nullable: true })
  updatedOrCreatedBy: number | null;
}
