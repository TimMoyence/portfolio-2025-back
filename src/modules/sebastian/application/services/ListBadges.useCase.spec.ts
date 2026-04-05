import { ListBadgesUseCase } from './ListBadges.useCase';
import { SebastianBadge } from '../../domain/SebastianBadge';
import { BADGE_CATALOG } from '../../domain/badge-catalog';
import { createMockSebastianBadgeRepo } from '../../../../../test/factories/sebastian.factory';

describe('ListBadgesUseCase', () => {
  let useCase: ListBadgesUseCase;
  let badgeRepo: ReturnType<typeof createMockSebastianBadgeRepo>;

  const userId = 'user-1';

  beforeEach(() => {
    badgeRepo = createMockSebastianBadgeRepo();
    useCase = new ListBadgesUseCase(badgeRepo);
  });

  it('devrait retourner tous les badges du catalogue avec unlocked=false quand aucun badge', async () => {
    badgeRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute(userId);

    expect(result).toHaveLength(BADGE_CATALOG.length);
    for (const badge of result) {
      expect(badge.unlocked).toBe(false);
      expect(badge.unlockedAt).toBeUndefined();
    }
  });

  it('devrait marquer unlocked=true avec la date pour les badges debloques', async () => {
    const unlockedAt = new Date('2026-03-20T10:00:00.000Z');
    const existingBadge = SebastianBadge.fromPersistence({
      id: 'badge-1',
      userId,
      badgeKey: 'first-log',
      category: 'global',
      unlockedAt,
    });
    badgeRepo.findByUserId.mockResolvedValue([existingBadge]);

    const result = await useCase.execute(userId);

    const firstLog = result.find((b) => b.key === 'first-log');
    expect(firstLog).toBeDefined();
    expect(firstLog!.unlocked).toBe(true);
    expect(firstLog!.unlockedAt).toBe(unlockedAt.toISOString());

    // Les autres restent verrouilles
    const others = result.filter((b) => b.key !== 'first-log');
    for (const badge of others) {
      expect(badge.unlocked).toBe(false);
      expect(badge.unlockedAt).toBeUndefined();
    }
  });

  it('devrait preserver l ordre du catalogue', async () => {
    badgeRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute(userId);

    const resultKeys = result.map((b) => b.key);
    const catalogKeys = BADGE_CATALOG.map((b) => b.key);
    expect(resultKeys).toEqual(catalogKeys);
  });

  it('devrait remplir correctement name, description et category depuis le catalogue', async () => {
    badgeRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute(userId);

    for (let i = 0; i < BADGE_CATALOG.length; i++) {
      expect(result[i].key).toBe(BADGE_CATALOG[i].key);
      expect(result[i].name).toBe(BADGE_CATALOG[i].name);
      expect(result[i].description).toBe(BADGE_CATALOG[i].description);
      expect(result[i].category).toBe(BADGE_CATALOG[i].category);
    }
  });
});
