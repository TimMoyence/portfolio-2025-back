import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServicesEntity } from './Services.entity';
import { ServicesFaqTranslationEntity } from './ServicesFaqTranslation.entity';

@Entity('service_faq')
export class ServicesFaqEntity {
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
