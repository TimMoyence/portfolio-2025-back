/* eslint-disable @typescript-eslint/unbound-method */
import { EvaluateBadgesUseCase } from './EvaluateBadges.useCase';
import { SebastianBadge } from '../../domain/SebastianBadge';
import type { SebastianEntry } from '../../domain/SebastianEntry';
import type { SebastianGoal } from '../../domain/SebastianGoal';
import {
  buildSebastianEntry,
  buildSebastianGoal,
  createMockSebastianEntryRepo,
  createMockSebastianGoalRepo,
  createMockSebastianBadgeRepo,
} from '../../../../../test/factories/sebastian.factory';

const DAY_MS = 86_400_000;

function dailyEntries(
  idPrefix: string,
  length: number,
  overrides: Partial<SebastianEntry>,
  firstDayOffset = 0,
): SebastianEntry[] {
  const now = Date.now();
  return Array.from({ length }, (_, i) =>
    buildSebastianEntry({
      ...overrides,
      id: `${idPrefix}-${i}`,
      date: new Date(now - (firstDayOffset + i) * DAY_MS),
    }),
  );
}

function sameDayCoffees(length: number): SebastianEntry[] {
  return Array.from({ length }, (_, i) =>
    buildSebastianEntry({
      id: `entry-${i}`,
      category: 'coffee',
      quantity: 1,
      date: new Date('2026-03-15'),
    }),
  );
}

function alcoholDailyGoal(targetQuantity: number): SebastianGoal {
  return buildSebastianGoal({
    category: 'alcohol',
    targetQuantity,
    period: 'daily',
    isActive: true,
  });
}

describe('EvaluateBadgesUseCase', () => {
  let useCase: EvaluateBadgesUseCase;
  let badgeRepo: ReturnType<typeof createMockSebastianBadgeRepo>;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;
  let goalRepo: ReturnType<typeof createMockSebastianGoalRepo>;

  const userId = 'user-1';

  beforeEach(() => {
    badgeRepo = createMockSebastianBadgeRepo();
    entryRepo = createMockSebastianEntryRepo();
    goalRepo = createMockSebastianGoalRepo();
    useCase = new EvaluateBadgesUseCase(badgeRepo, entryRepo, goalRepo);

    badgeRepo.findByUserId.mockResolvedValue([]);
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([]);

    badgeRepo.create.mockImplementation((badge) =>
      Promise.resolve({
        ...badge,
        id: `badge-${Date.now()}`,
      } as SebastianBadge),
    );
  });

  async function unlockedKeysFor(entries: SebastianEntry[]): Promise<string[]> {
    entryRepo.findByFilters.mockResolvedValue(entries);
    const result = await useCase.execute(userId);
    return result.map((badge) => badge.badgeKey);
  }

  it('devrait retourner un tableau vide quand aucun badge eligible', async () => {
    const alreadyUnlocked: SebastianBadge[] = [];
    badgeRepo.findByUserId.mockResolvedValue(alreadyUnlocked);

    const result = await useCase.execute(userId);

    expect(result).toEqual([]);
  });

  it('ne devrait pas reevaluer un badge deja debloque', async () => {
    const existingBadge = SebastianBadge.fromPersistence({
      id: 'badge-1',
      userId,
      badgeKey: 'first-log',
      category: 'global',
      unlockedAt: new Date(),
    });
    badgeRepo.findByUserId.mockResolvedValue([existingBadge]);

    const keys = await unlockedKeysFor([buildSebastianEntry()]);

    expect(keys.filter((key) => key === 'first-log')).toHaveLength(0);
  });

  describe('first-log', () => {
    it('devrait debloquer quand l utilisateur a au moins 1 entree', async () => {
      const keys = await unlockedKeysFor([buildSebastianEntry()]);

      expect(keys).toContain('first-log');
      expect(badgeRepo.create).toHaveBeenCalled();
    });

    it('ne devrait pas debloquer quand 0 entrees', async () => {
      const keys = await unlockedKeysFor([]);

      expect(keys).not.toContain('first-log');
    });
  });

  describe('zen-monk-7', () => {
    it('devrait debloquer apres 7 jours consecutifs sans alcool', async () => {
      const keys = await unlockedKeysFor(
        dailyEntries('entry', 10, { category: 'coffee' }),
      );

      expect(keys).toContain('zen-monk-7');
    });

    it('ne devrait pas debloquer si historique < 7 jours', async () => {
      const keys = await unlockedKeysFor(
        dailyEntries('entry', 3, { category: 'coffee' }),
      );

      expect(keys).not.toContain('zen-monk-7');
    });

    it('ne devrait pas debloquer si alcool dans les 7 derniers jours', async () => {
      const keys = await unlockedKeysFor(
        dailyEntries(
          'entry-alcohol',
          1,
          { category: 'alcohol', unit: 'standard_drink', quantity: 1 },
          3,
        ),
      );

      expect(keys).not.toContain('zen-monk-7');
    });
  });

  describe('espresso-machine', () => {
    it('devrait debloquer quand 5 cafes ou plus en un jour', async () => {
      const keys = await unlockedKeysFor(sameDayCoffees(5));

      expect(keys).toContain('espresso-machine');
    });

    it('ne devrait pas debloquer avec 4 cafes en un jour', async () => {
      const keys = await unlockedKeysFor(sameDayCoffees(4));

      expect(keys).not.toContain('espresso-machine');
    });
  });

  describe('dry-week', () => {
    it('devrait debloquer quand 0 alcool sur les 7 derniers jours (avec historique)', async () => {
      const keys = await unlockedKeysFor([
        ...dailyEntries('entry-old', 1, { category: 'coffee' }, 10),
        ...dailyEntries('entry-recent', 1, { category: 'coffee' }, 1),
      ]);

      expect(keys).toContain('dry-week');
    });

    it('ne devrait pas debloquer si historique < 7 jours', async () => {
      const keys = await unlockedKeysFor(
        dailyEntries('entry', 1, { category: 'coffee' }, 1),
      );

      expect(keys).not.toContain('dry-week');
    });

    it('ne devrait pas debloquer avec alcool dans les 7 derniers jours', async () => {
      const keys = await unlockedKeysFor(
        dailyEntries(
          'entry',
          1,
          { category: 'alcohol', unit: 'standard_drink' },
          2,
        ),
      );

      expect(keys).not.toContain('dry-week');
    });
  });

  describe('early-bird', () => {
    it('devrait debloquer quand une entree a createdAt avant 7h', async () => {
      const keys = await unlockedKeysFor([
        buildSebastianEntry({ createdAt: new Date('2026-03-15T05:30:00') }),
      ]);

      expect(keys).toContain('early-bird');
    });

    it('ne devrait pas debloquer quand createdAt apres 7h', async () => {
      const keys = await unlockedKeysFor([
        buildSebastianEntry({ createdAt: new Date('2026-03-15T09:00:00') }),
      ]);

      expect(keys).not.toContain('early-bird');
    });
  });

  describe('night-owl', () => {
    it('devrait debloquer quand une entree a createdAt entre minuit et 5h', async () => {
      const keys = await unlockedKeysFor([
        buildSebastianEntry({ createdAt: new Date('2026-03-15T02:30:00') }),
      ]);

      expect(keys).toContain('night-owl');
    });

    it('ne devrait pas debloquer quand createdAt a 5h ou plus', async () => {
      const keys = await unlockedKeysFor([
        buildSebastianEntry({ createdAt: new Date('2026-03-15T05:00:00') }),
      ]);

      expect(keys).not.toContain('night-owl');
    });
  });

  describe('comeback-kid', () => {
    const ALCOHOL_ENTRY = {
      category: 'alcohol' as const,
      unit: 'standard_drink' as const,
    };

    it('devrait debloquer quand semaine courante sous objectif et precedente au-dessus', async () => {
      goalRepo.findByUserId.mockResolvedValue([alcoholDailyGoal(2)]);

      const keys = await unlockedKeysFor([
        ...dailyEntries('prev', 7, { ...ALCOHOL_ENTRY, quantity: 3 }, 8),
        ...dailyEntries('curr', 7, { ...ALCOHOL_ENTRY, quantity: 1 }, 1),
      ]);

      expect(keys).toContain('comeback-kid');
    });

    it('ne devrait pas debloquer quand les deux semaines sont sous objectif', async () => {
      goalRepo.findByUserId.mockResolvedValue([alcoholDailyGoal(5)]);

      const keys = await unlockedKeysFor(
        dailyEntries('entry', 14, { ...ALCOHOL_ENTRY, quantity: 1 }, 1),
      );

      expect(keys).not.toContain('comeback-kid');
    });
  });

  describe('deblocage multiple', () => {
    it('devrait debloquer plusieurs badges en un seul appel', async () => {
      const keys = await unlockedKeysFor([
        buildSebastianEntry({
          id: 'entry-1',
          category: 'coffee',
          quantity: 1,
          createdAt: new Date('2026-03-15T03:00:00'),
        }),
      ]);

      expect(keys).toContain('first-log');
      expect(keys).toContain('early-bird');
      expect(keys).toContain('night-owl');
      expect(keys.length).toBeGreaterThanOrEqual(3);
    });
  });
});
