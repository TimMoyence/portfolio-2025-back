import { ColonnesDeTrace } from '../../../../common/infrastructure/typeorm/ColonnesDeTrace';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('IDX_redirects_enabled_created_at', ['enabled', 'createdAt'])
@Entity({ name: 'redirects' })
export class RedirectsEntity extends ColonnesDeTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('text')
  slug: string;

  @Column('text')
  targetUrl: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'int', default: 0 })
  clicks: number;
}
