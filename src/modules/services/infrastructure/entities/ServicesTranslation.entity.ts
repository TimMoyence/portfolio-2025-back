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
import { ServicesEntity } from './Services.entity';

@Entity({ name: 'services_translation' })
@Unique('uq_services_translation_locale', ['serviceId', 'locale'])
@Unique('uq_services_translation_locale_slug', ['locale', 'slug'])
export class ServicesTranslationEntity extends ColonnesDeTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  serviceId: string;

  @Column({ type: 'text' })
  locale: string;

  @ManyToOne(() => ServicesEntity, (service) => service.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceId' })
  service: ServicesEntity;

  @Index()
  @Column('text')
  slug: string;

  @Column('text')
  title: string;

  @Column('text')
  excerpt: string;

  @Column('text')
  content: string;
}
