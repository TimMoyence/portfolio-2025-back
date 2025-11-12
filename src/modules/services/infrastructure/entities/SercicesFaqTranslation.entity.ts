import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServicesFaqEntity } from './SercicesFaq.entity';

@Entity('service_faq')
export class ServicesFaqTranslationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServicesFaqEntity, (s) => s.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceFaqId' })
  service: ServicesFaqEntity;

  @Column('uuid')
  serviceFaqId: string;

  @Column({ type: 'text' })
  locale: string; // 'fr' | 'en'

  @Column({ type: 'text' })
  slug: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column({ type: 'int', default: 0 })
  order: number;

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
