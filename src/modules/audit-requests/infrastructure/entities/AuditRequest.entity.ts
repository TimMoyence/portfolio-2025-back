import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'audit_requests' })
export class AuditRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestId: string;

  @Column({ type: 'text' })
  websiteName: string;

  @Column({ type: 'varchar', length: 20 })
  contactMethod: string;

  @Column({ type: 'text' })
  contactValue: string;

  @Column({ type: 'boolean', default: false })
  done: boolean;

  @Column({ type: 'inet', nullable: true })
  ip?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  referer?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({
    name: 'updated_or_created_by',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  updatedOrCreatedBy: string | null;
}
