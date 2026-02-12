import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'contacts' })
export class ContactMessagesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  requestId: string;

  @Column('text')
  name: string;

  @Index()
  @Column('text')
  email: string; // store lowercase in service

  @Column('text')
  firstName: string;

  @Column('text')
  lastName: string;

  @Column('text', { nullable: true })
  phone: string | null;

  @Column('text')
  subject: string;

  @Column('text')
  message: string;

  @Column('text')
  role: string;

  @Column('boolean')
  terms: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  termsVersion?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  termsLocale?: string;

  @Column({ type: 'timestamp', nullable: true })
  termsAcceptedAt?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  termsMethod?: string;

  @Column({
    type: 'enum',
    enum: ['NEW', 'READ', 'REPLIED', 'SPAM'],
    default: 'NEW',
  })
  status: 'NEW' | 'READ' | 'REPLIED' | 'SPAM';

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
