import { TraductionDeContenu } from '../../../../common/infrastructure/typeorm/ColonnesDeContenu';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ServicesFaqEntity } from './ServicesFaq.entity';

@Entity({ name: 'service_faq_translation' })
@Unique('uq_service_faq_locale', ['serviceFaqId', 'locale'])
@Unique('uq_service_faq_locale_slug', ['locale', 'slug'])
export class ServicesFaqTranslationEntity extends TraductionDeContenu {
  @ManyToOne(() => ServicesFaqEntity, (s) => s.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceFaqId' })
  serviceFaq: ServicesFaqEntity;

  @Column('uuid')
  serviceFaqId: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;
}
