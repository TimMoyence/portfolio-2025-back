import type { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
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

export interface RequeteDePageTriee {
  readonly page: number;
  readonly limit: number;
  readonly order: SortOrder;
  readonly sortBy: string;
}

export interface ReglesDePagination<Q extends RequeteDePageTriee> {
  readonly alias: string;
  readonly colonnes: readonly Q['sortBy'][];
  readonly parDefaut: Q['sortBy'];
  readonly filtres?: (requete: Q) => Readonly<Record<string, unknown>>;
}

export abstract class DepotPagine<
  E extends ObjectLiteral,
  D,
  Q extends RequeteDePageTriee,
> {
  protected constructor(
    protected readonly repo: Repository<E>,
    private readonly regles: ReglesDePagination<Q>,
  ) {}

  findAll(requete: Q): Promise<PaginatedResult<D>> {
    const { alias, colonnes, parDefaut, filtres } = this.regles;
    const colonne = colonnes.includes(requete.sortBy)
      ? requete.sortBy
      : parDefaut;
    return pageDeRequete(
      this.repo.createQueryBuilder(alias),
      {
        ...requete,
        colonneDeTri: `${alias}.${colonne}`,
        filtres: filtres?.(requete),
      },
      (entite) => this.toDomain(entite),
    );
  }

  protected abstract toDomain(entite: E): D;
}
