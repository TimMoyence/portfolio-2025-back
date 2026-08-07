/* eslint-disable @typescript-eslint/unbound-method */
jest.mock('../../domain/badge-catalog', () => {
  const actual = jest.requireActual<
    typeof import('../../domain/badge-catalog')
  >('../../domain/badge-catalog');
  const catalog = [
    ...actual.BADGE_CATALOG,
    {
      key: 'test-long-window',
      name: 'Badge a fenetre longue',
      description: 'Badge de test declarant une fenetre de 60 jours',
      category: 'global',
    },
  ];
  return {
    ...actual,
    BADGE_CATALOG: catalog,
    VALID_BADGE_KEYS: catalog.map((c) => c.key),
  };
});

jest.mock('../../domain/badge-rules/badge-strategies', () => {
  const actual = jest.requireActual<
    typeof import('../../domain/badge-rules/badge-strategies')
  >('../../domain/badge-rules/badge-strategies');
  const longWindowStrategy: import('../../domain/badge-rules/badge-strategies').BadgeStrategy =
    {
      key: 'test-long-window',
      evaluationWindow: 60,
      evaluate: ({ entries, now }) =>
        entries.some(
          (e) => e.date.getTime() <= now.getTime() - 45 * 86_400_000,
        ),
    };
  return {
    ...actual,
    BADGE_STRATEGIES: new Map([
      ...actual.BADGE_STRATEGIES,
      ['test-long-window', longWindowStrategy],
    ]),
  };
});

import { EvaluateBadgesUseCase } from './EvaluateBadges.useCase';
import { SebastianBadge } from '../../domain/SebastianBadge';
import type { SebastianEntry } from '../../domain/SebastianEntry';
import type { SebastianEntryFilters } from '../../domain/ISebastianEntry.repository';
import { BADGE_CATALOG } from '../../domain/badge-catalog';
import { subtractDays } from '../../domain/badge-rules/badge-strategies';
import {
  buildSebastianEntry,
  createMockSebastianEntryRepo,
  createMockSebastianGoalRepo,
  createMockSebastianBadgeRepo,
} from '../../../../../test/factories/sebastian.factory';

const LONG_WINDOW_KEY = 'test-long-window';
const LONG_WINDOW_DAYS = 60;
const TRIGGER_AGE_DAYS = 45;

describe('EvaluateBadgesUseCase — fenetre de recuperation des entrees', () => {
  let useCase: EvaluateBadgesUseCase;
  let badgeRepo: ReturnType<typeof createMockSebastianBadgeRepo>;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;
  let goalRepo: ReturnType<typeof createMockSebastianGoalRepo>;

  const userId = 'user-1';
  const now = new Date('2026-03-15T12:00:00.000Z');

  const storedEntries: SebastianEntry[] = [
    buildSebastianEntry({
      id: 'entry-old',
      category: 'coffee',
      date: new Date(now.getTime() - TRIGGER_AGE_DAYS * 86_400_000),
    }),
    buildSebastianEntry({
      id: 'entry-recent',
      category: 'coffee',
      date: new Date(now.getTime() - 86_400_000),
    }),
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now.getTime());

    badgeRepo = createMockSebastianBadgeRepo();
    entryRepo = createMockSebastianEntryRepo();
    goalRepo = createMockSebastianGoalRepo();
    useCase = new EvaluateBadgesUseCase(badgeRepo, entryRepo, goalRepo);

    badgeRepo.findByUserId.mockResolvedValue(
      BADGE_CATALOG.filter((c) => c.key !== LONG_WINDOW_KEY).map((c) =>
        SebastianBadge.fromPersistence({
          id: `badge-${c.key}`,
          userId,
          badgeKey: c.key,
          category: c.category,
          unlockedAt: new Date(),
        }),
      ),
    );

    entryRepo.findByFilters.mockImplementation(
      (filters: SebastianEntryFilters) =>
        Promise.resolve(
          storedEntries.filter(
            (e) =>
              !filters.from ||
              e.date.toISOString().slice(0, 10) >= filters.from,
          ),
        ),
    );

    goalRepo.findByUserId.mockResolvedValue([]);

    badgeRepo.create.mockImplementation((badge) =>
      Promise.resolve({ ...badge, id: 'badge-new' } as SebastianBadge),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devrait recuperer les entrees sur la fenetre la plus longue declaree par le registry', async () => {
    await useCase.execute(userId);

    expect(entryRepo.findByFilters).toHaveBeenCalledWith({
      userId,
      from: subtractDays(now, LONG_WINDOW_DAYS),
    });
  });

  it('devrait debloquer un badge dont la fenetre depasse celle des badges existants', async () => {
    const result = await useCase.execute(userId);

    const badge = result.find((b) => b.badgeKey === LONG_WINDOW_KEY);
    expect(badge).toBeDefined();
  });
});
