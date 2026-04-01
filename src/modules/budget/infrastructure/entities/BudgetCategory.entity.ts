import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'budget_categories' })
export class BudgetCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  groupId: string | null;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 7, default: '#6B7280' })
  color: string;

  @Column({ type: 'varchar', length: 50, default: 'tag' })
  icon: string;

  @Column({
    name: 'budget_type',
    type: 'varchar',
    length: 10,
    default: 'VARIABLE',
  })
  budgetType: string;

  @Column({
    name: 'budget_limit',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  budgetLimit: number;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
