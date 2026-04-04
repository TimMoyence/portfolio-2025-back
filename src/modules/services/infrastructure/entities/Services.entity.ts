import {
  PUBLISHABLE_STATUSES,
  type PublishableStatus,
} from '../../../../common/domain/types/publishable-status';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServicesFaqEntity } from './ServicesFaq.entity';
import { ServicesTranslationEntity } from './ServicesTranslation.entity';

@Index('IDX_services_status_order', ['status', 'order'])
@Entity({ name: 'services' })
export class ServicesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('text')
  slug: string;

  @Column('text')
  name: string;

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @Column({
    type: 'enum',
    enum: PUBLISHABLE_STATUSES,
    default: 'PUBLISHED',
  })
  status: PublishableStatus;

  @Column({ type: 'int', default: 0 }) order: number;

  @OneToMany(() => ServicesFaqEntity, (faq) => faq.service, { cascade: true })
  faqs: ServicesFaqEntity[];

  @OneToMany(
    () => ServicesTranslationEntity,
    (translation) => translation.service,
    { cascade: true },
  )
  translations: ServicesTranslationEntity[];

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
