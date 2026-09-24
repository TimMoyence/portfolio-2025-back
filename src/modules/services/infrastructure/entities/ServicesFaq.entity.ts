import { ColonnesDeTrace } from '../../../../common/infrastructure/typeorm/ColonnesDeTrace';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServicesEntity } from './Services.entity';
import { ServicesFaqTranslationEntity } from './ServicesFaqTranslation.entity';

@Entity('service_faq')
export class ServicesFaqEntity extends ColonnesDeTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServicesEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: ServicesEntity;

  @Column('uuid')
  serviceId: string;

  @OneToMany(() => ServicesFaqTranslationEntity, (t) => t.serviceFaq, {
    cascade: true,
  })
  translations: ServicesFaqTranslationEntity[];
}
