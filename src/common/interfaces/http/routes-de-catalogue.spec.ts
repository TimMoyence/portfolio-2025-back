import { createPaginatedResult } from '../../domain/pagination.types';
import { reponsePaginee } from './routes-de-catalogue';

describe('reponsePaginee', () => {
  it('projette chaque element et reprend la pagination en meta', () => {
    const resultat = createPaginatedResult([1, 2], 5, 2, 2);

    expect(reponsePaginee(resultat, (n) => ({ valeur: n * 10 }))).toEqual({
      items: [{ valeur: 10 }, { valeur: 20 }],
      meta: { page: 2, limit: 2, total: 5, totalPages: 3 },
    });
  });
});
