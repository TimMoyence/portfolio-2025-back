import { PublishStatus } from 'src/modules/projects/infrastructure/enums/PublishStatus.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServicesTranslationEntity } from './ServicesTranslation.entity';
import { ServicesFaqEntity } from './ServicesFaq.entity';

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
    enum: PublishStatus,
    default: PublishStatus.PUBLISHED,
  })
  status: PublishStatus;

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

  @Column({ name: 'updated_or_created_by', type: 'int', nullable: true })
  updatedOrCreatedBy: number | null;
}
