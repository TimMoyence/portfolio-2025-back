import type { PaginatedResult } from '../../src/common/domain/pagination.types';

export function buildPaginatedResult<T>(items: T[]): PaginatedResult<T> {
  return {
    items,
    page: 1,
    limit: 10,
    total: items.length,
    totalPages: items.length === 0 ? 0 : 1,
  };
}

interface DepotPagine {
  findAll(requete: never): Promise<PaginatedResult<unknown>>;
}

type RequeteDe<R extends DepotPagine> = Parameters<R['findAll']>[0];
type ElementDe<R extends DepotPagine> = Awaited<
  ReturnType<R['findAll']>
>['items'][number];

export interface ContratDeListePaginee<R extends DepotPagine> {
  readonly creerDepot: () => jest.Mocked<R>;
  readonly creerUseCase: (depot: R) => {
    execute(requete: RequeteDe<R>): Promise<unknown>;
  };
  readonly requete: RequeteDe<R>;
  readonly elements: ElementDe<R>[];
}

export function casDeListePaginee<R extends DepotPagine>(
  contrat: ContratDeListePaginee<R>,
): [string, () => Promise<void>][] {
  const verifier = (elements: ElementDe<R>[]) => async () => {
    const depot = contrat.creerDepot();
    const attendu = buildPaginatedResult(elements);
    const findAll = jest
      .spyOn(depot as DepotPagine, 'findAll')
      .mockResolvedValue(attendu);

    const resultat = await contrat.creerUseCase(depot).execute(contrat.requete);

    expect(resultat).toEqual(attendu);
    expect(findAll).toHaveBeenCalledWith(contrat.requete);
  };
  return [
    ['la liste paginee du repository', verifier(contrat.elements)],
    ['une liste vide quand le repository est vide', verifier([])],
  ];
}
