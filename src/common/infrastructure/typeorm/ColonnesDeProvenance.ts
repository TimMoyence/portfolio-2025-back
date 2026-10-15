import { randomUUID } from 'crypto';
import { Column, PrimaryGeneratedColumn } from 'typeorm';
import type { Provenance } from '../../domain/provenance';
import { ColonnesDeTrace } from './ColonnesDeTrace';

export abstract class ColonnesDeRequete extends ColonnesDeTrace {
  @Column({ type: 'inet', nullable: true })
  ip?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  referer?: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestId: string;
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
