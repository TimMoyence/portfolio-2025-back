import { ColonnesDeRequete } from '../../../../common/infrastructure/typeorm/ColonnesDeProvenance';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'contacts' })
@Index(['requestId'])
export class ContactMessagesEntity extends ColonnesDeRequete {
  @Column('text')
  name: string;

  @Index()
  @Column('text')
  email: string;

  @Column('text')
  firstName: string;

  @Column('text')
  lastName: string;

  @Column('text', { nullable: true })
  phone: string | null;

  @Column('text')
  subject: string;

  @Column('text')
  message: string;

  @Column('text')
  role: string;

  @Column('boolean')
  terms: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  termsVersion?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  termsLocale?: string;

  @Column({ type: 'timestamp', nullable: true })
  termsAcceptedAt?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  termsMethod?: string;

  @Column({
    type: 'enum',
    enum: ['NEW', 'READ', 'REPLIED', 'SPAM'],
    default: 'NEW',
  })
  status: 'NEW' | 'READ' | 'REPLIED' | 'SPAM';
}
