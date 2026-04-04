import type { SebastianEntry } from '../../src/modules/sebastian/domain/SebastianEntry';
import type { SebastianGoal } from '../../src/modules/sebastian/domain/SebastianGoal';
import type { ISebastianEntryRepository } from '../../src/modules/sebastian/domain/ISebastianEntry.repository';
import type { ISebastianGoalRepository } from '../../src/modules/sebastian/domain/ISebastianGoal.repository';

/** Construit un objet SebastianEntry domaine avec des valeurs par defaut. */
export function buildSebastianEntry(
  overrides?: Partial<SebastianEntry>,
): SebastianEntry {
  return {
    id: 'entry-1',
    userId: 'user-1',
    category: 'coffee',
    quantity: 2,
    unit: 'cup',
    date: new Date('2026-03-15'),
    notes: null,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  } as SebastianEntry;
}

/** Construit un objet SebastianGoal domaine avec des valeurs par defaut. */
export function buildSebastianGoal(
  overrides?: Partial<SebastianGoal>,
): SebastianGoal {
  return {
    id: 'goal-1',
    userId: 'user-1',
    category: 'coffee',
    targetQuantity: 3,
    period: 'daily',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  } as SebastianGoal;
}

/** Cree un mock complet du repository entrees Sebastian. */
export function createMockSebastianEntryRepo(): jest.Mocked<ISebastianEntryRepository> {
  return {
    create: jest.fn(),
    findByFilters: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  };
}

/** Cree un mock complet du repository objectifs Sebastian. */
export function createMockSebastianGoalRepo(): jest.Mocked<ISebastianGoalRepository> {
  return {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

/** Resultat de statistiques par defaut pour les tests. */
export interface StatsResult {
  byCategory: Array<{
    category: string;
    total: number;
    average: number;
    trend: number;
  }>;
  period: string;
}

/** Construit un resultat de statistiques avec des valeurs par defaut. */
export function buildStatsResult(
  overrides?: Partial<StatsResult>,
): StatsResult {
  return {
    byCategory: [
      { category: 'coffee', total: 14, average: 2, trend: -10 },
      { category: 'alcohol', total: 3, average: 0.43, trend: 5 },
    ],
    period: 'week',
    ...overrides,
  };
}
