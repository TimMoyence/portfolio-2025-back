/* eslint-disable @typescript-eslint/unbound-method */
import { EvaluateBadgesUseCase } from './EvaluateBadges.useCase';
import { SebastianBadge } from '../../domain/SebastianBadge';
import {
  buildSebastianEntry,
  buildSebastianGoal,
  createMockSebastianEntryRepo,
  createMockSebastianGoalRepo,
  createMockSebastianBadgeRepo,
} from '../../../../../test/factories/sebastian.factory';

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

    // Par defaut : aucun badge existant, aucune entree, aucun objectif
    badgeRepo.findByUserId.mockResolvedValue([]);
    entryRepo.findByFilters.mockResolvedValue([]);
    goalRepo.findByUserId.mockResolvedValue([]);

    // Le create retourne le badge tel quel
    badgeRepo.create.mockImplementation((badge) =>
      Promise.resolve({
        ...badge,
        id: `badge-${Date.now()}`,
      } as SebastianBadge),
    );
  });

  it('devrait retourner un tableau vide quand tous les badges eligibles sont deja debloques', async () => {
    // Avec 0 entrees, zen-monk-7, zen-monk-30 et dry-week sont satisfaits
    // On les marque comme deja debloques pour verifier qu'on ne les recree pas
    const alreadyUnlocked = ['zen-monk-7', 'zen-monk-30', 'dry-week'].map(
      (key) =>
        SebastianBadge.fromPersistence({
          id: `badge-${key}`,
          userId,
          badgeKey: key,
          category: 'alcohol',
          unlockedAt: new Date(),
        }),
    );
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
    entryRepo.findByFilters.mockResolvedValue([buildSebastianEntry()]);

    const result = await useCase.execute(userId);

    const firstLogBadges = result.filter((b) => b.badgeKey === 'first-log');
    expect(firstLogBadges).toHaveLength(0);
  });

  describe('first-log', () => {
    it('devrait debloquer quand l utilisateur a au moins 1 entree', async () => {
      entryRepo.findByFilters.mockResolvedValue([buildSebastianEntry()]);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'first-log');
      expect(badge).toBeDefined();
      expect(badgeRepo.create).toHaveBeenCalled();
    });

    it('ne devrait pas debloquer quand 0 entrees', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'first-log');
      expect(badge).toBeUndefined();
    });
  });

  describe('zen-monk-7', () => {
    it('devrait debloquer apres 7 jours consecutifs sans alcool', async () => {
      // Uniquement des entrees cafe, aucune entree alcool
      const now = new Date();
      const coffeeEntries = Array.from({ length: 7 }, (_, i) =>
        buildSebastianEntry({
          id: `entry-${i}`,
          category: 'coffee',
          date: new Date(now.getTime() - i * 86_400_000),
        }),
      );
      entryRepo.findByFilters.mockResolvedValue(coffeeEntries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'zen-monk-7');
      expect(badge).toBeDefined();
    });

    it('ne devrait pas debloquer si alcool dans les 7 derniers jours', async () => {
      const now = new Date();
      const entries = [
        buildSebastianEntry({
          id: 'entry-alcohol',
          category: 'alcohol',
          unit: 'standard_drink',
          quantity: 1,
          date: new Date(now.getTime() - 3 * 86_400_000),
        }),
      ];
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'zen-monk-7');
      expect(badge).toBeUndefined();
    });
  });

  describe('espresso-machine', () => {
    it('devrait debloquer quand 5 cafes ou plus en un jour', async () => {
      const sameDay = new Date('2026-03-15');
      const entries = Array.from({ length: 5 }, (_, i) =>
        buildSebastianEntry({
          id: `entry-${i}`,
          category: 'coffee',
          quantity: 1,
          date: sameDay,
        }),
      );
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'espresso-machine');
      expect(badge).toBeDefined();
    });

    it('ne devrait pas debloquer avec 4 cafes en un jour', async () => {
      const sameDay = new Date('2026-03-15');
      const entries = Array.from({ length: 4 }, (_, i) =>
        buildSebastianEntry({
          id: `entry-${i}`,
          category: 'coffee',
          quantity: 1,
          date: sameDay,
        }),
      );
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'espresso-machine');
      expect(badge).toBeUndefined();
    });
  });

  describe('dry-week', () => {
    it('devrait debloquer quand 0 alcool sur les 7 derniers jours', async () => {
      // Seulement des cafes recents
      const now = new Date();
      const entries = [
        buildSebastianEntry({
          category: 'coffee',
          date: new Date(now.getTime() - 86_400_000),
        }),
      ];
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'dry-week');
      expect(badge).toBeDefined();
    });

    it('ne devrait pas debloquer avec alcool dans les 7 derniers jours', async () => {
      const now = new Date();
      const entries = [
        buildSebastianEntry({
          category: 'alcohol',
          unit: 'standard_drink',
          date: new Date(now.getTime() - 2 * 86_400_000),
        }),
      ];
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'dry-week');
      expect(badge).toBeUndefined();
    });
  });

  describe('early-bird', () => {
    it('devrait debloquer quand une entree a createdAt avant 7h', async () => {
      const earlyMorning = new Date('2026-03-15T05:30:00');
      const entries = [buildSebastianEntry({ createdAt: earlyMorning })];
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'early-bird');
      expect(badge).toBeDefined();
    });

    it('ne devrait pas debloquer quand createdAt apres 7h', async () => {
      const midMorning = new Date('2026-03-15T09:00:00');
      const entries = [buildSebastianEntry({ createdAt: midMorning })];
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'early-bird');
      expect(badge).toBeUndefined();
    });
  });

  describe('night-owl', () => {
    it('devrait debloquer quand une entree a createdAt entre minuit et 5h', async () => {
      const lateNight = new Date('2026-03-15T02:30:00');
      const entries = [buildSebastianEntry({ createdAt: lateNight })];
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'night-owl');
      expect(badge).toBeDefined();
    });

    it('ne devrait pas debloquer quand createdAt a 5h ou plus', async () => {
      const morning = new Date('2026-03-15T05:00:00');
      const entries = [buildSebastianEntry({ createdAt: morning })];
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'night-owl');
      expect(badge).toBeUndefined();
    });
  });

  describe('comeback-kid', () => {
    it('devrait debloquer quand semaine courante sous objectif et precedente au-dessus', async () => {
      const now = new Date();
      const goal = buildSebastianGoal({
        category: 'alcohol',
        targetQuantity: 2,
        period: 'daily',
        isActive: true,
      });
      goalRepo.findByUserId.mockResolvedValue([goal]);

      // Semaine precedente : moyenne > 2 (total 21 / 7 = 3)
      const previousWeekEntries = Array.from({ length: 7 }, (_, i) =>
        buildSebastianEntry({
          id: `prev-${i}`,
          category: 'alcohol',
          unit: 'standard_drink',
          quantity: 3,
          date: new Date(now.getTime() - (8 + i) * 86_400_000),
        }),
      );

      // Semaine courante : moyenne < 2 (total 7 / 7 = 1)
      const currentWeekEntries = Array.from({ length: 7 }, (_, i) =>
        buildSebastianEntry({
          id: `curr-${i}`,
          category: 'alcohol',
          unit: 'standard_drink',
          quantity: 1,
          date: new Date(now.getTime() - (1 + i) * 86_400_000),
        }),
      );

      entryRepo.findByFilters.mockResolvedValue([
        ...previousWeekEntries,
        ...currentWeekEntries,
      ]);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'comeback-kid');
      expect(badge).toBeDefined();
    });

    it('ne devrait pas debloquer quand les deux semaines sont sous objectif', async () => {
      const now = new Date();
      const goal = buildSebastianGoal({
        category: 'alcohol',
        targetQuantity: 5,
        period: 'daily',
        isActive: true,
      });
      goalRepo.findByUserId.mockResolvedValue([goal]);

      // Les deux semaines avec moyenne < 5
      const entries = Array.from({ length: 14 }, (_, i) =>
        buildSebastianEntry({
          id: `entry-${i}`,
          category: 'alcohol',
          unit: 'standard_drink',
          quantity: 1,
          date: new Date(now.getTime() - (1 + i) * 86_400_000),
        }),
      );

      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      const badge = result.find((b) => b.badgeKey === 'comeback-kid');
      expect(badge).toBeUndefined();
    });
  });

  describe('deblocage multiple', () => {
    it('devrait debloquer plusieurs badges en un seul appel', async () => {
      const earlyMorning = new Date('2026-03-15T03:00:00');
      const entries = [
        buildSebastianEntry({
          id: 'entry-1',
          category: 'coffee',
          quantity: 1,
          createdAt: earlyMorning,
        }),
      ];
      entryRepo.findByFilters.mockResolvedValue(entries);

      const result = await useCase.execute(userId);

      // Devrait avoir au moins first-log, early-bird, night-owl, dry-week, zen-monk-7
      const keys = result.map((b) => b.badgeKey);
      expect(keys).toContain('first-log');
      expect(keys).toContain('early-bird');
      expect(keys).toContain('night-owl');
      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });
});
