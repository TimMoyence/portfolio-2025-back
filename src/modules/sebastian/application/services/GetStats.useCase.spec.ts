/* eslint-disable @typescript-eslint/unbound-method */
import { GetStatsUseCase } from './GetStats.useCase';
import {
  buildSebastianEntry,
  createMockSebastianEntryRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('GetStatsUseCase', () => {
  let useCase: GetStatsUseCase;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;

  beforeEach(() => {
    entryRepo = createMockSebastianEntryRepo();
    useCase = new GetStatsUseCase(entryRepo);
  });

  it('devrait calculer les statistiques pour la periode week', async () => {
    const currentEntries = [
      buildSebastianEntry({ category: 'coffee', quantity: 2 }),
      buildSebastianEntry({ category: 'coffee', quantity: 3 }),
      buildSebastianEntry({ category: 'alcohol', quantity: 1 }),
    ];
    const previousEntries = [
      buildSebastianEntry({ category: 'coffee', quantity: 4 }),
      buildSebastianEntry({ category: 'alcohol', quantity: 2 }),
    ];

    entryRepo.findByFilters
      .mockResolvedValueOnce(currentEntries)
      .mockResolvedValueOnce(previousEntries);

    const result = await useCase.execute({ userId: 'user-1', period: 'week' });

    expect(result.period).toBe('week');
    expect(result.byCategory).toHaveLength(2);

    const coffeeStats = result.byCategory.find((s) => s.category === 'coffee');
    expect(coffeeStats).toBeDefined();
    expect(coffeeStats!.total).toBe(5);
    expect(coffeeStats!.average).toBe(0.71);
    expect(coffeeStats!.trend).toBe(25);

    const alcoholStats = result.byCategory.find(
      (s) => s.category === 'alcohol',
    );
    expect(alcoholStats).toBeDefined();
    expect(alcoholStats!.total).toBe(1);
    expect(alcoholStats!.trend).toBe(-50);
  });

  it('devrait retourner un tableau vide si aucune entree', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1', period: 'month' });

    expect(result.period).toBe('month');
    expect(result.byCategory).toEqual([]);
  });

  it('devrait calculer une tendance a 0 si pas de periode precedente', async () => {
    const currentEntries = [
      buildSebastianEntry({ category: 'coffee', quantity: 3 }),
    ];

    entryRepo.findByFilters
      .mockResolvedValueOnce(currentEntries)
      .mockResolvedValueOnce([]);

    const result = await useCase.execute({ userId: 'user-1', period: 'year' });

    const coffeeStats = result.byCategory.find((s) => s.category === 'coffee');
    expect(coffeeStats!.trend).toBe(0);
  });

  it('devrait appeler findByFilters deux fois (courant + precedent)', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);

    await useCase.execute({ userId: 'user-1', period: 'week' });

    expect(entryRepo.findByFilters).toHaveBeenCalledTimes(2);
  });
});
