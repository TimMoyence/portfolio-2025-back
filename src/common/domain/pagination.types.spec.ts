import { createPaginatedResult } from './pagination.types';

describe('createPaginatedResult', () => {
  it('devrait creer un resultat pagine standard', () => {
    const result = createPaginatedResult(['a', 'b'], 10, 1, 5);

    expect(result.items).toEqual(['a', 'b']);
    expect(result.total).toBe(10);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('devrait calculer le nombre de pages arrondi au superieur', () => {
    const result = createPaginatedResult([], 11, 1, 5);
    expect(result.totalPages).toBe(3);
  });

  it('devrait retourner 0 totalPages quand total est 0', () => {
    const result = createPaginatedResult([], 0, 1, 10);
    expect(result.totalPages).toBe(0);
  });

  it('devrait garantir un limit minimum de 1', () => {
    const result = createPaginatedResult(['a'], 5, 1, 0);
    expect(result.limit).toBe(1);
    expect(result.totalPages).toBe(5);
  });

  it('devrait gerer un limit negatif', () => {
    const result = createPaginatedResult(['a'], 5, 1, -10);
    expect(result.limit).toBe(1);
    expect(result.totalPages).toBe(5);
  });
});
