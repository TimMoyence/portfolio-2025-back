import { Column } from 'typeorm';
import { ColonnesDeTrace } from './ColonnesDeTrace';

export abstract class ColonnesDeProvenance extends ColonnesDeTrace {
  @Column({ type: 'inet', nullable: true })
  ip?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  referer?: string;
}
