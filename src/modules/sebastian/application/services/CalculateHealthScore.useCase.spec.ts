import { CalculateHealthScoreUseCase } from './CalculateHealthScore.useCase';
import type {
  SebastianCategory,
  SebastianEntry,
} from '../../domain/SebastianEntry';
import type { SebastianGoal } from '../../domain/SebastianGoal';
import {
  buildSebastianEntry,
  buildSebastianGoal,
  createMockSebastianEntryRepo,
  createMockSebastianGoalRepo,
} from '../../../../../test/factories/sebastian.factory';

function daysAgo(daysOffset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dailyGoal(
  category: SebastianCategory,
  targetQuantity: number,
  overrides: Partial<SebastianGoal> = {},
): SebastianGoal {
  return buildSebastianGoal({
    category,
    targetQuantity,
    period: 'daily',
    isActive: true,
    ...overrides,
  });
}

function entryOn(
  category: SebastianCategory,
  quantity: number,
  daysOffset: number,
  id?: string,
): SebastianEntry {
  return buildSebastianEntry({
    ...(id ? { id } : {}),
    category,
    quantity,
    date: daysAgo(daysOffset),
  });
}

function dailySeries(
  idPrefix: string,
  category: SebastianCategory,
  quantity: number,
  length: number,
  firstDaysOffset = 0,
): SebastianEntry[] {
  return Array.from({ length }, (_, i) =>
    entryOn(category, quantity, firstDaysOffset + i, `${idPrefix}-${i}`),
  );
}

describe('CalculateHealthScoreUseCase', () => {
  let useCase: CalculateHealthScoreUseCase;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;
  let goalRepo: ReturnType<typeof createMockSebastianGoalRepo>;

  beforeEach(() => {
    entryRepo = createMockSebastianEntryRepo();
    goalRepo = createMockSebastianGoalRepo();
    useCase = new CalculateHealthScoreUseCase(entryRepo, goalRepo);
  });

  it('devrait retourner score 0 sans objectifs actifs', async () => {
    goalRepo.findByUserId.mockResolvedValue([]);
    entryRepo.findByFilters.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBe(0);
    expect(result.phase).toBe(1);
    expect(result.breakdown.goalAdherence).toBe(0);
    expect(result.streaks).toEqual({ alcohol: 0, coffee: 0 });
    expect(result.message).toBe('Definis un objectif pour debloquer ton score');
  });

  it('devrait retourner score 100 quand la consommation est sous l objectif', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 3)]);
    entryRepo.findByFilters.mockResolvedValue([entryOn('coffee', 1, 0)]);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(1);
    expect(result.breakdown.goalAdherence).toBe(100);
    expect(result.score).toBe(100);
  });

  it('devrait retourner score 100 quand la consommation est exactement a l objectif', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 3)]);
    entryRepo.findByFilters.mockResolvedValue([entryOn('coffee', 3, 0)]);

    const result = await useCase.execute('user-1');

    expect(result.breakdown.goalAdherence).toBe(100);
    expect(result.score).toBe(100);
  });

  it('devrait diminuer proportionnellement quand la consommation depasse l objectif', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 2)]);
    entryRepo.findByFilters.mockResolvedValue([entryOn('coffee', 4, 0)]);

    const result = await useCase.execute('user-1');

    expect(result.breakdown.goalAdherence).toBe(0);
    expect(result.score).toBe(0);
  });

  it('devrait calculer la moyenne pour plusieurs categories', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      dailyGoal('coffee', 2, { id: 'goal-1' }),
      dailyGoal('alcohol', 2, { id: 'goal-2' }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      entryOn('coffee', 2, 0),
      entryOn('alcohol', 4, 0),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.breakdown.goalAdherence).toBe(50);
    expect(result.score).toBe(50);
  });

  it('devrait detecter la phase 2 avec >= 7 jours distincts', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 3)]);
    entryRepo.findByFilters.mockResolvedValue(
      dailySeries('entry', 'coffee', 1, 7),
    );

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(2);
  });

  it('devrait detecter la phase 3 avec >= 30 jours distincts', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 3)]);
    entryRepo.findByFilters.mockResolvedValue(
      dailySeries('entry', 'coffee', 1, 30),
    );

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(3);
  });

  it('devrait appliquer un bonus positif si la tendance est decroissante', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 5)]);
    entryRepo.findByFilters.mockResolvedValue([
      ...dailySeries('current', 'coffee', 1, 7),
      ...dailySeries('previous', 'coffee', 5, 7, 7),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(2);
    expect(result.breakdown.trendBonus).toBeDefined();
    expect(result.breakdown.trendBonus).toBeGreaterThan(0);
    expect(result.breakdown.trendBonus).toBeLessThanOrEqual(15);
  });

  it('devrait appliquer un malus negatif si la tendance est croissante', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 5)]);
    entryRepo.findByFilters.mockResolvedValue([
      ...dailySeries('current', 'coffee', 5, 7),
      ...dailySeries('previous', 'coffee', 1, 7, 7),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(2);
    expect(result.breakdown.trendBonus).toBeDefined();
    expect(result.breakdown.trendBonus).toBeLessThan(0);
    expect(result.breakdown.trendBonus).toBeGreaterThanOrEqual(-15);
  });

  it('devrait appliquer le bonus de streak correctement', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 3)]);
    entryRepo.findByFilters.mockResolvedValue(
      dailySeries('entry', 'coffee', 1, 30),
    );

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(3);
    expect(result.breakdown.streakBonus).toBeDefined();
    expect(result.breakdown.streakBonus).toBeGreaterThan(0);
    expect(result.streaks.coffee).toBeGreaterThanOrEqual(30);
  });

  it('devrait plafonner le bonus de streak a 20', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      dailyGoal('coffee', 5, { id: 'goal-coffee' }),
      dailyGoal('alcohol', 5, { id: 'goal-alcohol' }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      ...dailySeries('coffee', 'coffee', 1, 60),
      ...dailySeries('alcohol', 'alcohol', 1, 60),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(3);
    expect(result.breakdown.streakBonus).toBe(20);
  });

  it('devrait compter les streaks consecutifs correctement', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 2)]);
    entryRepo.findByFilters.mockResolvedValue([
      entryOn('coffee', 1, 0, 'e0'),
      entryOn('coffee', 1, 1, 'e1'),
      entryOn('coffee', 2, 2, 'e2'),
      entryOn('coffee', 5, 3, 'e3'),
      ...dailySeries('filler', 'coffee', 1, 31, 4),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.streaks.coffee).toBe(3);
  });

  it('devrait afficher "Excellent !" pour un score >= 90', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 5)]);
    entryRepo.findByFilters.mockResolvedValue([entryOn('coffee', 1, 0)]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.message).toBe('Excellent ! Continue comme ca !');
  });

  it('devrait afficher "En bonne voie !" pour un score >= 70 et < 90', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      dailyGoal('coffee', 2, { id: 'goal-coffee' }),
      dailyGoal('alcohol', 2, { id: 'goal-alcohol' }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      entryOn('coffee', 2, 0),
      entryOn('alcohol', 3, 0),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThan(90);
    expect(result.message).toBe('En bonne voie !');
  });

  it('devrait afficher "Peut mieux faire..." pour un score >= 50 et < 70', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      dailyGoal('coffee', 2, { id: 'goal-coffee' }),
      dailyGoal('alcohol', 2, { id: 'goal-alcohol' }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      entryOn('coffee', 2, 0),
      entryOn('alcohol', 4, 0),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(70);
    expect(result.message).toBe('Peut mieux faire, garde le cap');
  });

  it('devrait afficher "Attention cette semaine" pour un score < 50', async () => {
    goalRepo.findByUserId.mockResolvedValue([dailyGoal('coffee', 1)]);
    entryRepo.findByFilters.mockResolvedValue([entryOn('coffee', 10, 0)]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBeLessThan(50);
    expect(result.message).toBe('Attention cette semaine');
  });

  it('devrait ignorer les objectifs inactifs', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      dailyGoal('coffee', 3, { isActive: false }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBe(0);
    expect(result.message).toBe('Definis un objectif pour debloquer ton score');
  });

  it('devrait ignorer les objectifs non-daily pour le calcul', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      dailyGoal('coffee', 10, { period: 'weekly' }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBe(0);
    expect(result.message).toBe('Definis un objectif pour debloquer ton score');
  });
});
