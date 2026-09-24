import { ColonnesDeTrace } from '../../../../common/infrastructure/typeorm/ColonnesDeTrace';
import {
  Column,
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
export class ServicesFaqTranslationEntity extends ColonnesDeTrace {
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
  locale: string;

  @Index()
  @Column({ type: 'text' })
  slug: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;
}
