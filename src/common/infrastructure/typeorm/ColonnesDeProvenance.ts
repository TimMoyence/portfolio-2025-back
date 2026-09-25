import { randomUUID } from 'crypto';
import { Column, PrimaryGeneratedColumn } from 'typeorm';
import { ColonnesDeTrace } from './ColonnesDeTrace';

export abstract class ColonnesDeProvenance extends ColonnesDeTrace {
  @Column({ type: 'inet', nullable: true })
  ip?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  referer?: string;
}

export abstract class ColonnesDeRequete extends ColonnesDeProvenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestId: string;
}

export interface Provenance {
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}

export function valeursDeProvenance(provenance: Provenance): {
  ip?: string;
  userAgent?: string;
  referer?: string;
  requestId: string;
} {
  return {
    ip: provenance.ip ?? undefined,
    userAgent: provenance.userAgent ?? undefined,
    referer: provenance.referer ?? undefined,
    requestId: randomUUID(),
  };
}
