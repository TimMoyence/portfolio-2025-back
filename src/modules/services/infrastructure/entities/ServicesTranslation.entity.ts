import { TraductionDeContenu } from '../../../../common/infrastructure/typeorm/ColonnesDeContenu';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ServicesEntity } from './Services.entity';

@Entity({ name: 'services_translation' })
@Unique('uq_services_translation_locale', ['serviceId', 'locale'])
@Unique('uq_services_translation_locale_slug', ['locale', 'slug'])
export class ServicesTranslationEntity extends TraductionDeContenu {
  @Column('uuid')
  serviceId: string;

  @ManyToOne(() => ServicesEntity, (service) => service.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceId' })
  service: ServicesEntity;

  @Column('text')
  title: string;

  @Column('text')
  excerpt: string;

  @Column('text')
  content: string;
}
