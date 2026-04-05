import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import type { ISebastianGoalRepository } from '../../domain/ISebastianGoal.repository';
import {
  SEBASTIAN_ENTRY_REPOSITORY,
  SEBASTIAN_GOAL_REPOSITORY,
} from '../../domain/token';
import type { GetTrendsQuery } from '../dto/GetTrends.query';

/** Point de donnee quotidien pour les tendances. */
export interface TrendDataPoint {
  date: string; // YYYY-MM-DD
  alcohol: number;
  coffee: number;
}

/** Resultat des donnees de tendance de consommation. */
export interface TrendResult {
  period: '7d' | '30d';
  dataPoints: TrendDataPoint[];
  objectives: { alcohol: number; coffee: number };
  summary: { avgAlcohol: number; avgCoffee: number };
}

/** Nombre de jours par type de periode de tendance. */
const TREND_PERIOD_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
};

/** Diviseur pour convertir un objectif en quota quotidien selon la periode. */
const GOAL_PERIOD_DIVISOR: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/**
 * Calcule les donnees de tendance (points quotidiens) pour un utilisateur.
 *
 * Recupere les entrees et objectifs, construit les points de donnee jour par jour,
 * derive les objectifs quotidiens et calcule les moyennes sur la periode.
 */
@Injectable()
export class GetTrendDataUseCase {
  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
    @Inject(SEBASTIAN_GOAL_REPOSITORY)
    private readonly goalRepo: ISebastianGoalRepository,
  ) {}

  /** Execute le calcul des donnees de tendance. */
  async execute(query: GetTrendsQuery): Promise<TrendResult> {
    const days = TREND_PERIOD_DAYS[query.period];
    const now = new Date();

    const to = now.toISOString().slice(0, 10);
    const from = new Date(now.getTime() - days * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const [entries, goals] = await Promise.all([
      this.entryRepo.findByFilters({ userId: query.userId, from, to }),
      this.goalRepo.findByUserId(query.userId),
    ]);

    // Agreger les entrees par jour et categorie
    const dailyMap = new Map<string, { alcohol: number; coffee: number }>();
    for (const entry of entries) {
      const dateKey =
        entry.date instanceof Date
          ? entry.date.toISOString().slice(0, 10)
          : String(entry.date).slice(0, 10);
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { alcohol: 0, coffee: 0 });
      }
      const day = dailyMap.get(dateKey)!;
      if (entry.category === 'alcohol') {
        day.alcohol += Number(entry.quantity);
      } else if (entry.category === 'coffee') {
        day.coffee += Number(entry.quantity);
      }
    }

    // Construire les dataPoints pour chaque jour de la periode
    const dataPoints: TrendDataPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const day = dailyMap.get(date);
      dataPoints.push({
        date,
        alcohol: day?.alcohol ?? 0,
        coffee: day?.coffee ?? 0,
      });
    }

    // Calculer les objectifs quotidiens depuis les goals actifs
    const activeGoals = goals.filter((g) => g.isActive);
    let alcoholObjective = 0;
    let coffeeObjective = 0;
    for (const goal of activeGoals) {
      const divisor = GOAL_PERIOD_DIVISOR[goal.period] ?? 1;
      const dailyQuota =
        Math.round((Number(goal.targetQuantity) / divisor) * 100) / 100;
      if (goal.category === 'alcohol') {
        alcoholObjective = dailyQuota;
      } else if (goal.category === 'coffee') {
        coffeeObjective = dailyQuota;
      }
    }

    // Calculer les moyennes
    const totalAlcohol = dataPoints.reduce((sum, dp) => sum + dp.alcohol, 0);
    const totalCoffee = dataPoints.reduce((sum, dp) => sum + dp.coffee, 0);
    const avgAlcohol =
      days > 0 ? Math.round((totalAlcohol / days) * 100) / 100 : 0;
    const avgCoffee =
      days > 0 ? Math.round((totalCoffee / days) * 100) / 100 : 0;

    return {
      period: query.period,
      dataPoints,
      objectives: { alcohol: alcoholObjective, coffee: coffeeObjective },
      summary: { avgAlcohol, avgCoffee },
    };
  }
}
