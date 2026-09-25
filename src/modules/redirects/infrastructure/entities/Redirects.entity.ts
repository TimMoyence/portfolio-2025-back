import { ContenuASlugUnique } from '../../../../common/infrastructure/typeorm/ColonnesDeContenu';
import { Column, Entity, Index } from 'typeorm';

@Index('IDX_redirects_enabled_created_at', ['enabled', 'createdAt'])
@Entity({ name: 'redirects' })
export class RedirectsEntity extends ContenuASlugUnique {
  @Column('text')
  targetUrl: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'int', default: 0 })
  clicks: number;
}
