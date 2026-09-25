import type { Type } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { DeepPartial, Repository } from 'typeorm';
import {
  valeursDeProvenance,
  type ColonnesDeRequete,
  type Provenance,
} from './ColonnesDeProvenance';

export abstract class ConsignationDeRequetes<E extends ColonnesDeRequete> {
  protected constructor(protected readonly repo: Repository<E>) {}

  protected async consigner(
    valeurs: DeepPartial<E>,
    provenance: Provenance,
  ): Promise<E> {
    const ligne = this.repo.create({
      ...valeurs,
      ...valeursDeProvenance(provenance),
    });
    await this.repo.save(ligne);
    return ligne;
  }
}

export function DepotDeRequetes<E extends ColonnesDeRequete>(
  entite: Type<E>,
): abstract new (repo: Repository<E>) => ConsignationDeRequetes<E> {
  abstract class Depot extends ConsignationDeRequetes<E> {
    constructor(@InjectRepository(entite) repo: Repository<E>) {
      super(repo);
    }
  }
  return Depot;
}
