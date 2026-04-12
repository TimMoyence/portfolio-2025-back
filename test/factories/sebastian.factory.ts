import type { IBadgesEvaluationQueuePort } from '../../src/modules/sebastian/domain/IBadgesEvaluationQueue.port';
import type { SebastianEntry } from '../../src/modules/sebastian/domain/SebastianEntry';
import type { SebastianGoal } from '../../src/modules/sebastian/domain/SebastianGoal';
import type { SebastianBadge } from '../../src/modules/sebastian/domain/SebastianBadge';
import type { ISebastianEntryRepository } from '../../src/modules/sebastian/domain/ISebastianEntry.repository';
import type { ISebastianGoalRepository } from '../../src/modules/sebastian/domain/ISebastianGoal.repository';
import type { ISebastianBadgeRepository } from '../../src/modules/sebastian/domain/ISebastianBadge.repository';
import type { SebastianProfile } from '../../src/modules/sebastian/domain/SebastianProfile';
import type { ISebastianProfileRepository } from '../../src/modules/sebastian/domain/ISebastianProfile.repository';
import type { TrendResult } from '../../src/modules/sebastian/application/services/GetTrendData.useCase';
import type { HealthScoreResult } from '../../src/modules/sebastian/application/services/CalculateHealthScore.useCase';
import type { PeriodReportResult } from '../../src/modules/sebastian/application/services/GetPeriodReport.useCase';
import type { BadgeStatusResult } from '../../src/modules/sebastian/application/services/ListBadges.useCase';
import type { LinkTelegramUserUseCase } from '../../src/modules/sebastian/application/services/LinkTelegramUser.useCase';
import type { ResolveTelegramUserUseCase } from '../../src/modules/sebastian/application/services/ResolveTelegramUser.useCase';
import type { RegisterDrinksFromTelegramUseCase } from '../../src/modules/sebastian/application/services/RegisterDrinksFromTelegram.useCase';
import type { CalculateBacUseCase } from '../../src/modules/sebastian/application/services/CalculateBac.useCase';

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
    drinkType: null,
    alcoholDegree: null,
    volumeCl: null,
    consumedAt: null,
    ...overrides,
  } as SebastianEntry;
}

/** Construit un objet SebastianProfile domaine avec des valeurs par defaut. */
export function buildSebastianProfile(
  overrides?: Partial<SebastianProfile>,
): SebastianProfile {
  return {
    id: 'profile-1',
    userId: 'user-1',
    weightKg: 70,
    widmarkR: 0.68,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as SebastianProfile;
}

/** Cree un mock complet du repository profils Sebastian. */
export function createMockSebastianProfileRepo(): jest.Mocked<ISebastianProfileRepository> {
  return {
    findByUserId: jest.fn(),
    createOrUpdate: jest.fn(),
  };
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

/** Construit un objet SebastianBadge domaine avec des valeurs par defaut. */
export function buildSebastianBadge(
  overrides?: Partial<SebastianBadge>,
): SebastianBadge {
  return {
    id: 'badge-1',
    userId: 'user-1',
    badgeKey: 'first-log',
    category: 'global',
    unlockedAt: new Date('2026-04-01'),
    ...overrides,
  } as SebastianBadge;
}

/** Cree un mock complet du repository badges Sebastian. */
export function createMockSebastianBadgeRepo(): jest.Mocked<ISebastianBadgeRepository> {
  return {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findByUserIdAndKey: jest.fn(),
  };
}

/** Cree un mock du port de queue d'evaluation des badges. */
export function createMockBadgesEvaluationQueue(): jest.Mocked<IBadgesEvaluationQueuePort> {
  return {
    enqueue: jest.fn().mockResolvedValue(undefined),
  };
}

/** Construit un resultat de tendances avec des valeurs par defaut. */
export function buildTrendData(overrides?: Partial<TrendResult>): TrendResult {
  return {
    period: '7d',
    dataPoints: [
      { date: '2026-03-30', alcohol: 1, coffee: 2 },
      { date: '2026-03-31', alcohol: 0, coffee: 3 },
      { date: '2026-04-01', alcohol: 2, coffee: 1 },
      { date: '2026-04-02', alcohol: 0, coffee: 2 },
      { date: '2026-04-03', alcohol: 1, coffee: 2 },
      { date: '2026-04-04', alcohol: 0, coffee: 1 },
      { date: '2026-04-05', alcohol: 1, coffee: 2 },
    ],
    objectives: { alcohol: 2, coffee: 3 },
    summary: { avgAlcohol: 0.71, avgCoffee: 1.86 },
    ...overrides,
  };
}

/** Construit un resultat de score de sante avec des valeurs par defaut. */
export function buildHealthScore(
  overrides?: Partial<HealthScoreResult>,
): HealthScoreResult {
  return {
    score: 85,
    phase: 1,
    breakdown: { goalAdherence: 85 },
    streaks: { alcohol: 3, coffee: 0 },
    message: 'En bonne voie !',
    ...overrides,
  };
}

/** Construit un resultat de rapport de periode avec des valeurs par defaut. */
export function buildPeriodReport(
  overrides?: Partial<PeriodReportResult>,
): PeriodReportResult {
  return {
    period: 'week',
    startDate: '2026-03-30',
    endDate: '2026-04-05',
    totals: { alcohol: 5, coffee: 13 },
    dailyAvg: { alcohol: 0.71, coffee: 1.86 },
    best: { date: '2026-04-04', score: 1 },
    worst: { date: '2026-03-31', score: 3 },
    comparison: { alcoholDelta: -10, coffeeDelta: 5 },
    distribution: [
      { dayOfWeek: 0, alcohol: 1, coffee: 2 },
      { dayOfWeek: 1, alcohol: 0, coffee: 3 },
      { dayOfWeek: 2, alcohol: 2, coffee: 1 },
      { dayOfWeek: 3, alcohol: 0, coffee: 2 },
      { dayOfWeek: 4, alcohol: 1, coffee: 2 },
      { dayOfWeek: 5, alcohol: 0, coffee: 1 },
      { dayOfWeek: 6, alcohol: 1, coffee: 2 },
    ],
    heatmap: [
      { date: '2026-03-30', alcohol: 1, coffee: 2, combined: 3 },
      { date: '2026-03-31', alcohol: 0, coffee: 3, combined: 3 },
      { date: '2026-04-01', alcohol: 2, coffee: 1, combined: 3 },
      { date: '2026-04-02', alcohol: 0, coffee: 2, combined: 2 },
      { date: '2026-04-03', alcohol: 1, coffee: 2, combined: 3 },
      { date: '2026-04-04', alcohol: 0, coffee: 1, combined: 1 },
      { date: '2026-04-05', alcohol: 1, coffee: 2, combined: 3 },
    ],
    ...overrides,
  };
}

/** Construit un statut de badge avec des valeurs par defaut. */
export function buildBadgeStatus(
  overrides?: Partial<BadgeStatusResult>,
): BadgeStatusResult {
  return {
    key: 'first-log',
    name: 'Premier pas',
    description: 'Premiere entree enregistree',
    category: 'global',
    unlocked: true,
    unlockedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Typage des mocks de use cases du bot Telegram Sebastian. */
export interface MockSebastianBotUseCases {
  linkUser: jest.Mocked<Pick<LinkTelegramUserUseCase, 'execute'>>;
  resolveUser: jest.Mocked<Pick<ResolveTelegramUserUseCase, 'execute'>>;
  registerDrinks: jest.Mocked<
    Pick<RegisterDrinksFromTelegramUseCase, 'execute'>
  >;
  calculateBac: jest.Mocked<Pick<CalculateBacUseCase, 'execute'>>;
}

/** Cree des mocks types pour tous les use cases du SebastianBotHandler. */
export function createMockSebastianBotUseCases(): MockSebastianBotUseCases {
  return {
    linkUser: { execute: jest.fn() },
    resolveUser: { execute: jest.fn() },
    registerDrinks: { execute: jest.fn() },
    calculateBac: { execute: jest.fn() },
  };
}
