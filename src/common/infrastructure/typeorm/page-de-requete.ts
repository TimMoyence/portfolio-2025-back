import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import {
  createPaginatedResult,
  type PaginatedResult,
  type SortOrder,
} from '../../domain/pagination.types';

export interface DemandeDePage {
  readonly page: number;
  readonly limit: number;
  readonly order: SortOrder;
  readonly colonneDeTri: string;
  readonly filtres?: Readonly<Record<string, unknown>>;
}

export async function pageDeRequete<E extends ObjectLiteral, D>(
  requete: SelectQueryBuilder<E>,
  demande: DemandeDePage,
  versDomaine: (entite: E) => D,
): Promise<PaginatedResult<D>> {
  for (const [colonne, valeur] of Object.entries(demande.filtres ?? {})) {
    if (valeur !== undefined && valeur !== null) {
      requete.andWhere(`${requete.alias}.${colonne} = :${colonne}`, {
        [colonne]: valeur,
      });
    }
  }
  const [entites, total] = await requete
    .orderBy(demande.colonneDeTri, demande.order)
    .skip((demande.page - 1) * demande.limit)
    .take(demande.limit)
    .getManyAndCount();
  return createPaginatedResult(
    entites.map((entite) => versDomaine(entite)),
    total,
    demande.page,
    demande.limit,
  );
}
