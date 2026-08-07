import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import type { ISebastianGoalRepository } from '../../domain/ISebastianGoal.repository';
import {
  SEBASTIAN_ENTRY_REPOSITORY,
  SEBASTIAN_GOAL_REPOSITORY,
} from '../../domain/token';
import type { GetTrendsQuery } from '../dto/GetTrends.query';

export interface TrendDataPoint {
  date: string;
  alcohol: number;
  coffee: number;
}

export interface TrendResult {
  period: '7d' | '30d';
  dataPoints: TrendDataPoint[];
  objectives: { alcohol: number; coffee: number };
  summary: { avgAlcohol: number; avgCoffee: number };
}

const TREND_PERIOD_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
};

const GOAL_PERIOD_DIVISOR: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

@Injectable()
export class GetTrendDataUseCase {
  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
    @Inject(SEBASTIAN_GOAL_REPOSITORY)
    private readonly goalRepo: ISebastianGoalRepository,
  ) {}

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
