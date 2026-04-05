import { CalculateHealthScoreUseCase } from './CalculateHealthScore.useCase';
import {
  buildSebastianEntry,
  buildSebastianGoal,
  createMockSebastianEntryRepo,
  createMockSebastianGoalRepo,
} from '../../../../../test/factories/sebastian.factory';

/**
 * Helper : genere une date ISO (YYYY-MM-DD) decalee de `daysOffset` jours
 * par rapport a aujourd'hui.
 */
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

  // -----------------------------------------------------------------------
  // Pas d'objectifs
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // Phase 1 — Adherence aux objectifs
  // -----------------------------------------------------------------------
  it('devrait retourner score 100 quand la consommation est sous l objectif', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: true,
      }),
    ]);
    // 1 cafe aujourd'hui (< 3)
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
    // 4 cafes = double de l'objectif → (1 - (4-2)/2) * 100 = 0
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
    // coffee: 2 (= objectif) → 100
    // alcohol: 4 (double) → (1 - (4-2)/2)*100 = 0
    // moyenne = 50
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

  // -----------------------------------------------------------------------
  // Detection de phase
  // -----------------------------------------------------------------------
  it('devrait detecter la phase 2 avec >= 7 jours distincts', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: true,
      }),
    ]);

    // 7 jours distincts d'entrees (sous objectif chaque jour)
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

  // -----------------------------------------------------------------------
  // Phase 2 — Bonus/malus de tendance
  // -----------------------------------------------------------------------
  it('devrait appliquer un bonus positif si la tendance est decroissante', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 5,
        period: 'daily',
        isActive: true,
      }),
    ]);

    // 10 jours distincts pour activer phase 2
    // Jours 0-6 (semaine courante) : 1 cafe/jour = total 7
    // Jours 7-9 + extras pour la semaine precedente : total beaucoup plus
    const entries = [
      // Semaine courante (jours 0-6) : 1/jour
      ...Array.from({ length: 7 }, (_, i) =>
        buildSebastianEntry({
          id: `current-${i}`,
          category: 'coffee',
          quantity: 1,
          date: daysAgo(i),
        }),
      ),
      // Semaine precedente (jours 7-13) : 5/jour
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
      // Semaine courante (jours 0-6) : 5/jour
      ...Array.from({ length: 7 }, (_, i) =>
        buildSebastianEntry({
          id: `current-${i}`,
          category: 'coffee',
          quantity: 5,
          date: daysAgo(i),
        }),
      ),
      // Semaine precedente (jours 7-13) : 1/jour
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

  // -----------------------------------------------------------------------
  // Phase 3 — Bonus de streak
  // -----------------------------------------------------------------------
  it('devrait appliquer le bonus de streak correctement', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 3,
        period: 'daily',
        isActive: true,
      }),
    ]);

    // 30 jours distincts, tous sous l'objectif → streak = 30 mais cap a 10 par categorie
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

    // 60 jours, les deux categories sous objectif → streaks enormes
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

  // -----------------------------------------------------------------------
  // Comptage des streaks
  // -----------------------------------------------------------------------
  it('devrait compter les streaks consecutifs correctement', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({
        category: 'coffee',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      }),
    ]);

    // Jours 0, 1, 2 : sous objectif → streak = 3
    // Jour 3 : au-dessus → casse la serie
    // + jours 4-34 pour avoir 30+ jours distincts (phase 3)
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
      // Jours 4-34 : 1 cafe/jour pour remplir les 30 jours distincts
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

  // -----------------------------------------------------------------------
  // Messages
  // -----------------------------------------------------------------------
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
    // coffee target=2 qty=2 → 100
    // alcohol target=2 qty=3 → (1-(3-2)/2)*100 = 50
    // moyenne = 75
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
    // coffee: 2/2 → 100, alcohol: 4/2 → (1-(4-2)/2)*100 = 0
    // moyenne = 50
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
    // coffee: 10/1 → (1-(10-1)/1)*100 = -800 → cap 0
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

  // -----------------------------------------------------------------------
  // Objectifs inactifs ou non-daily ignores
  // -----------------------------------------------------------------------
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
