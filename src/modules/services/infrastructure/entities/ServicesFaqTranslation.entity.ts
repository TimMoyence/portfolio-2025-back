import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ServicesFaqEntity } from './ServicesFaq.entity';

@Entity({ name: 'service_faq_translation' })
@Unique('uq_service_faq_locale', ['serviceFaqId', 'locale'])
@Unique('uq_service_faq_locale_slug', ['locale', 'slug'])
export class ServicesFaqTranslationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServicesFaqEntity, (s) => s.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceFaqId' })
  serviceFaq: ServicesFaqEntity;

  @Column('uuid')
  serviceFaqId: string;

  @Column({ type: 'text' })
  locale: string; // 'fr' | 'en'

  @Index()
  @Column({ type: 'text' })
  slug: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

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
