import { CalculateHealthScoreUseCase } from './CalculateHealthScore.useCase';
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
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: true,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      buildSebastianEntry({
        category: 'coffee',
        quantity: 1,
        date: daysAgo(0),
      }),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(1);
    expect(result.breakdown.goalAdherence).toBe(100);
    expect(result.score).toBe(100);
  });

  it('devrait retourner score 100 quand la consommation est exactement a l objectif', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: true,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      buildSebastianEntry({
        category: 'coffee',
        quantity: 3,
        date: daysAgo(0),
      }),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.breakdown.goalAdherence).toBe(100);
    expect(result.score).toBe(100);
  });

  it('devrait diminuer proportionnellement quand la consommation depasse l objectif', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      buildSebastianEntry({
        category: 'coffee',
        quantity: 4,
        date: daysAgo(0),
      }),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.breakdown.goalAdherence).toBe(0);
    expect(result.score).toBe(0);
  });

  it('devrait calculer la moyenne pour plusieurs categories', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        id: 'goal-1',
        category: 'coffee',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
      buildSebastianGoal({
        id: 'goal-2',
        category: 'alcohol',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      buildSebastianEntry({
        category: 'coffee',
        quantity: 2,
        date: daysAgo(0),
      }),
      buildSebastianEntry({
        category: 'alcohol',
        quantity: 4,
        date: daysAgo(0),
      }),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.breakdown.goalAdherence).toBe(50);
    expect(result.score).toBe(50);
  });

  it('devrait detecter la phase 2 avec >= 7 jours distincts', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: true,
      }),
    ]);

    const entries = Array.from({ length: 7 }, (_, i) =>
      buildSebastianEntry({
        id: `entry-${i}`,
        category: 'coffee',
        quantity: 1,
        date: daysAgo(i),
      }),
    );
    entryRepo.findByFilters.mockResolvedValue(entries);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(2);
  });

  it('devrait detecter la phase 3 avec >= 30 jours distincts', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: true,
      }),
    ]);

    const entries = Array.from({ length: 30 }, (_, i) =>
      buildSebastianEntry({
        id: `entry-${i}`,
        category: 'coffee',
        quantity: 1,
        date: daysAgo(i),
      }),
    );
    entryRepo.findByFilters.mockResolvedValue(entries);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(3);
  });

  it('devrait appliquer un bonus positif si la tendance est decroissante', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 5,
        period: 'daily',
        isActive: true,
      }),
    ]);

    const entries = [
      ...Array.from({ length: 7 }, (_, i) =>
        buildSebastianEntry({
          id: `current-${i}`,
          category: 'coffee',
          quantity: 1,
          date: daysAgo(i),
        }),
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        buildSebastianEntry({
          id: `previous-${i}`,
          category: 'coffee',
          quantity: 5,
          date: daysAgo(7 + i),
        }),
      ),
    ];
    entryRepo.findByFilters.mockResolvedValue(entries);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(2);
    expect(result.breakdown.trendBonus).toBeDefined();
    expect(result.breakdown.trendBonus).toBeGreaterThan(0);
    expect(result.breakdown.trendBonus).toBeLessThanOrEqual(15);
  });

  it('devrait appliquer un malus negatif si la tendance est croissante', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 5,
        period: 'daily',
        isActive: true,
      }),
    ]);

    const entries = [
      ...Array.from({ length: 7 }, (_, i) =>
        buildSebastianEntry({
          id: `current-${i}`,
          category: 'coffee',
          quantity: 5,
          date: daysAgo(i),
        }),
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        buildSebastianEntry({
          id: `previous-${i}`,
          category: 'coffee',
          quantity: 1,
          date: daysAgo(7 + i),
        }),
      ),
    ];
    entryRepo.findByFilters.mockResolvedValue(entries);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(2);
    expect(result.breakdown.trendBonus).toBeDefined();
    expect(result.breakdown.trendBonus).toBeLessThan(0);
    expect(result.breakdown.trendBonus).toBeGreaterThanOrEqual(-15);
  });

  it('devrait appliquer le bonus de streak correctement', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: true,
      }),
    ]);

    const entries = Array.from({ length: 30 }, (_, i) =>
      buildSebastianEntry({
        id: `entry-${i}`,
        category: 'coffee',
        quantity: 1,
        date: daysAgo(i),
      }),
    );
    entryRepo.findByFilters.mockResolvedValue(entries);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(3);
    expect(result.breakdown.streakBonus).toBeDefined();
    expect(result.breakdown.streakBonus).toBeGreaterThan(0);
    expect(result.streaks.coffee).toBeGreaterThanOrEqual(30);
  });

  it('devrait plafonner le bonus de streak a 20', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        id: 'goal-coffee',
        category: 'coffee',
        targetQuantity: 5,
        period: 'daily',
        isActive: true,
      }),
      buildSebastianGoal({
        id: 'goal-alcohol',
        category: 'alcohol',
        targetQuantity: 5,
        period: 'daily',
        isActive: true,
      }),
    ]);

    const entries = [
      ...Array.from({ length: 60 }, (_, i) =>
        buildSebastianEntry({
          id: `coffee-${i}`,
          category: 'coffee',
          quantity: 1,
          date: daysAgo(i),
        }),
      ),
      ...Array.from({ length: 60 }, (_, i) =>
        buildSebastianEntry({
          id: `alcohol-${i}`,
          category: 'alcohol',
          quantity: 1,
          date: daysAgo(i),
        }),
      ),
    ];
    entryRepo.findByFilters.mockResolvedValue(entries);

    const result = await useCase.execute('user-1');

    expect(result.phase).toBe(3);
    expect(result.breakdown.streakBonus).toBe(20);
  });

  it('devrait compter les streaks consecutifs correctement', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
    ]);

    const entries = [
      buildSebastianEntry({
        id: 'e0',
        category: 'coffee',
        quantity: 1,
        date: daysAgo(0),
      }),
      buildSebastianEntry({
        id: 'e1',
        category: 'coffee',
        quantity: 1,
        date: daysAgo(1),
      }),
      buildSebastianEntry({
        id: 'e2',
        category: 'coffee',
        quantity: 2,
        date: daysAgo(2),
      }),
      buildSebastianEntry({
        id: 'e3',
        category: 'coffee',
        quantity: 5,
        date: daysAgo(3),
      }),
      ...Array.from({ length: 31 }, (_, i) =>
        buildSebastianEntry({
          id: `filler-${i}`,
          category: 'coffee',
          quantity: 1,
          date: daysAgo(4 + i),
        }),
      ),
    ];
    entryRepo.findByFilters.mockResolvedValue(entries);

    const result = await useCase.execute('user-1');

    expect(result.streaks.coffee).toBe(3);
  });

  it('devrait afficher "Excellent !" pour un score >= 90', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 5,
        period: 'daily',
        isActive: true,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      buildSebastianEntry({
        category: 'coffee',
        quantity: 1,
        date: daysAgo(0),
      }),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.message).toBe('Excellent ! Continue comme ca !');
  });

  it('devrait afficher "En bonne voie !" pour un score >= 70 et < 90', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        id: 'goal-coffee',
        category: 'coffee',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
      buildSebastianGoal({
        id: 'goal-alcohol',
        category: 'alcohol',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      buildSebastianEntry({
        category: 'coffee',
        quantity: 2,
        date: daysAgo(0),
      }),
      buildSebastianEntry({
        category: 'alcohol',
        quantity: 3,
        date: daysAgo(0),
      }),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThan(90);
    expect(result.message).toBe('En bonne voie !');
  });

  it('devrait afficher "Peut mieux faire..." pour un score >= 50 et < 70', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        id: 'goal-coffee',
        category: 'coffee',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
      buildSebastianGoal({
        id: 'goal-alcohol',
        category: 'alcohol',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      buildSebastianEntry({
        category: 'coffee',
        quantity: 2,
        date: daysAgo(0),
      }),
      buildSebastianEntry({
        category: 'alcohol',
        quantity: 4,
        date: daysAgo(0),
      }),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(70);
    expect(result.message).toBe('Peut mieux faire, garde le cap');
  });

  it('devrait afficher "Attention cette semaine" pour un score < 50', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 1,
        period: 'daily',
        isActive: true,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([
      buildSebastianEntry({
        category: 'coffee',
        quantity: 10,
        date: daysAgo(0),
      }),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBeLessThan(50);
    expect(result.message).toBe('Attention cette semaine');
  });

  it('devrait ignorer les objectifs inactifs', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: false,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBe(0);
    expect(result.message).toBe('Definis un objectif pour debloquer ton score');
  });

  it('devrait ignorer les objectifs non-daily pour le calcul', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 10,
        period: 'weekly',
        isActive: true,
      }),
    ]);
    entryRepo.findByFilters.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result.score).toBe(0);
    expect(result.message).toBe('Definis un objectif pour debloquer ton score');
  });
});
