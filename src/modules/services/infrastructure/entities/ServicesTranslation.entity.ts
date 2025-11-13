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
import { ServicesEntity } from './Services.entity';

@Entity({ name: 'services_translation' })
@Unique('uq_services_translation_locale', ['serviceId', 'locale'])
@Unique('uq_services_translation_locale_slug', ['locale', 'slug'])
export class ServicesTranslationEntity {
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
