import { GetTrendDataUseCase } from './GetTrendData.useCase';
import type { TrendResult } from './GetTrendData.useCase';
import {
  buildSebastianEntry,
  buildSebastianGoal,
  createMockSebastianEntryRepo,
  createMockSebastianGoalRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('GetTrendDataUseCase', () => {
  let useCase: GetTrendDataUseCase;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;
  let goalRepo: ReturnType<typeof createMockSebastianGoalRepo>;

  beforeEach(() => {
    entryRepo = createMockSebastianEntryRepo();
    goalRepo = createMockSebastianGoalRepo();
    useCase = new GetTrendDataUseCase(entryRepo, goalRepo);
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse('2026-04-05T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devrait retourner 7 dataPoints pour la periode 7d', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([]);

    const result: TrendResult = await useCase.execute({
      userId: 'user-1',
      period: '7d',
    });

    expect(result.period).toBe('7d');
    expect(result.dataPoints).toHaveLength(7);
  });

  it('devrait retourner 30 dataPoints pour la periode 30d', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([]);

    const result: TrendResult = await useCase.execute({
      userId: 'user-1',
      period: '30d',
    });

    expect(result.period).toBe('30d');
    expect(result.dataPoints).toHaveLength(30);
  });

  it('devrait agreger les entrees correctement par jour et categorie', async () => {
    const entries = [
      buildSebastianEntry({
        category: 'alcohol',
        quantity: 2,
        date: new Date('2026-04-03'),
      }),
      buildSebastianEntry({
        category: 'alcohol',
        quantity: 1,
        date: new Date('2026-04-03'),
      }),
      buildSebastianEntry({
        category: 'coffee',
        quantity: 3,
        date: new Date('2026-04-03'),
      }),
      buildSebastianEntry({
        category: 'coffee',
        quantity: 1,
        date: new Date('2026-04-04'),
      }),
    ];

    entryRepo.findByFilters.mockResolvedValue(entries);
    goalRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1', period: '7d' });

    const april3 = result.dataPoints.find((dp) => dp.date === '2026-04-03');
    expect(april3).toBeDefined();
    expect(april3!.alcohol).toBe(3);
    expect(april3!.coffee).toBe(3);

    const april4 = result.dataPoints.find((dp) => dp.date === '2026-04-04');
    expect(april4).toBeDefined();
    expect(april4!.alcohol).toBe(0);
    expect(april4!.coffee).toBe(1);
  });

  it('devrait avoir des valeurs a 0 pour les jours sans entrees', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1', period: '7d' });

    for (const dp of result.dataPoints) {
      expect(dp.alcohol).toBe(0);
      expect(dp.coffee).toBe(0);
    }
  });

  it('devrait deriver les objectifs quotidiens depuis des goals daily', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'alcohol',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
      buildSebastianGoal({
        id: 'goal-2',
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: true,
      }),
    ]);

    const result = await useCase.execute({ userId: 'user-1', period: '7d' });

    expect(result.objectives.alcohol).toBe(2);
    expect(result.objectives.coffee).toBe(3);
  });

  it('devrait deriver les objectifs quotidiens depuis des goals weekly (divise par 7)', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'alcohol',
        targetQuantity: 14,
        period: 'weekly',
        isActive: true,
      }),
      buildSebastianGoal({
        id: 'goal-2',
        category: 'coffee',
        targetQuantity: 21,
        period: 'weekly',
        isActive: true,
      }),
    ]);

    const result = await useCase.execute({ userId: 'user-1', period: '7d' });

    expect(result.objectives.alcohol).toBe(2);
    expect(result.objectives.coffee).toBe(3);
  });

  it('devrait deriver les objectifs quotidiens depuis des goals monthly (divise par 30)', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'alcohol',
        targetQuantity: 60,
        period: 'monthly',
        isActive: true,
      }),
      buildSebastianGoal({
        id: 'goal-2',
        category: 'coffee',
        targetQuantity: 90,
        period: 'monthly',
        isActive: true,
      }),
    ]);

    const result = await useCase.execute({ userId: 'user-1', period: '30d' });

    expect(result.objectives.alcohol).toBe(2);
    expect(result.objectives.coffee).toBe(3);
  });

  it('devrait retourner des objectifs a 0 sans goals', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1', period: '7d' });

    expect(result.objectives.alcohol).toBe(0);
    expect(result.objectives.coffee).toBe(0);
  });

  it('devrait calculer les moyennes correctes dans le summary', async () => {
    const entries = [
      buildSebastianEntry({
        category: 'alcohol',
        quantity: 2,
        date: new Date('2026-04-01'),
      }),
      buildSebastianEntry({
        category: 'alcohol',
        quantity: 5,
        date: new Date('2026-04-03'),
      }),
      buildSebastianEntry({
        category: 'coffee',
        quantity: 3,
        date: new Date('2026-04-02'),
      }),
    ];

    entryRepo.findByFilters.mockResolvedValue(entries);
    goalRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1', period: '7d' });

    // total alcohol = 7, avg = 7/7 = 1
    expect(result.summary.avgAlcohol).toBe(1);
    // total coffee = 3, avg = 3/7 = 0.43
    expect(result.summary.avgCoffee).toBe(0.43);
  });

  it('devrait retourner tout a zero avec des entrees vides', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1', period: '7d' });

    expect(result.summary.avgAlcohol).toBe(0);
    expect(result.summary.avgCoffee).toBe(0);
    expect(result.objectives.alcohol).toBe(0);
    expect(result.objectives.coffee).toBe(0);
    expect(
      result.dataPoints.every((dp) => dp.alcohol === 0 && dp.coffee === 0),
    ).toBe(true);
  });
});
