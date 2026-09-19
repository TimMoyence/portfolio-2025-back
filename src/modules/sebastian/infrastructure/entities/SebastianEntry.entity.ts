import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersEntity } from '../../../users/infrastructure/entities/Users.entity';

@Entity({ name: 'sebastian_entries' })
@Index('idx_sebastian_entries_user_date', ['userId', 'date'])
@Index('idx_sebastian_entries_category', ['category'])
@Index('idx_sebastian_entries_consumed_at', ['userId', 'consumedAt'], {
  where: '"consumed_at" IS NOT NULL',
})
@Check(
  'sebastian_entries_category_check',
  `"category" IN ('alcohol', 'coffee')`,
)
@Check('sebastian_entries_quantity_check', `"quantity" > 0`)
@Check('sebastian_entries_unit_check', `"unit" IN ('standard_drink', 'cup')`)
export class SebastianEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey(() => UsersEntity, {
    name: 'sebastian_entries_user_id_fkey',
    onDelete: 'CASCADE',
  })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar', length: 20 })
  unit: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'drink_type', type: 'varchar', length: 20, nullable: true })
  drinkType: string | null;

  @Column({
    name: 'alcohol_degree',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  alcoholDegree: number | null;

  @Column({
    name: 'volume_cl',
    type: 'decimal',
    precision: 6,
    scale: 1,
    nullable: true,
  })
  volumeCl: number | null;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
