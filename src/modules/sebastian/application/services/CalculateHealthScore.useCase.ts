import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import type { ISebastianGoalRepository } from '../../domain/ISebastianGoal.repository';
import type { SebastianEntry } from '../../domain/SebastianEntry';
import type { SebastianGoal } from '../../domain/SebastianGoal';
import {
  SEBASTIAN_ENTRY_REPOSITORY,
  SEBASTIAN_GOAL_REPOSITORY,
} from '../../domain/token';

export interface HealthScoreResult {
  score: number;
  phase: 1 | 2 | 3;
  breakdown: {
    goalAdherence: number;
    trendBonus?: number;
    streakBonus?: number;
  };
  streaks: { alcohol: number; coffee: number };
  message: string;
}

const PHASE_2_THRESHOLD = 7;
const PHASE_3_THRESHOLD = 30;

const TREND_BONUS_MIN = 5;
const TREND_BONUS_MAX = 15;

const STREAK_BONUS_CAP = 20;

@Injectable()
export class CalculateHealthScoreUseCase {
  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
    @Inject(SEBASTIAN_GOAL_REPOSITORY)
    private readonly goalRepo: ISebastianGoalRepository,
  ) {}

  async execute(userId: string): Promise<HealthScoreResult> {
    const [allEntries, allGoals] = await Promise.all([
      this.entryRepo.findByFilters({ userId }),
      this.goalRepo.findByUserId(userId),
    ]);

    const activeDailyGoals = allGoals.filter(
      (g) => g.isActive && g.period === 'daily',
    );

    if (activeDailyGoals.length === 0) {
      return {
        score: 0,
        phase: 1,
        breakdown: { goalAdherence: 0 },
        streaks: { alcohol: 0, coffee: 0 },
        message: 'Definis un objectif pour debloquer ton score',
      };
    }

    const phase = this.determinePhase(allEntries);
    const goalAdherence = this.calculateGoalAdherence(
      allEntries,
      activeDailyGoals,
    );

    let trendBonus: number | undefined;
    if (phase >= 2) {
      trendBonus = this.calculateTrendBonus(allEntries, activeDailyGoals);
    }

    const streaks = this.calculateStreaks(allEntries, activeDailyGoals);

    let streakBonus: number | undefined;
    if (phase >= 3) {
      streakBonus = Math.min(
        streaks.alcohol + streaks.coffee,
        STREAK_BONUS_CAP,
      );
    }

    const rawScore = goalAdherence + (trendBonus ?? 0) + (streakBonus ?? 0);
    const score = Math.round(rawScore);

    const breakdown: HealthScoreResult['breakdown'] = {
      goalAdherence: Math.round(goalAdherence),
    };
    if (trendBonus !== undefined) {
      breakdown.trendBonus = Math.round(trendBonus);
    }
    if (streakBonus !== undefined) {
      breakdown.streakBonus = Math.round(streakBonus);
    }

    return {
      score,
      phase,
      breakdown,
      streaks,
      message: this.getMessage(score, true),
    };
  }

  private determinePhase(entries: SebastianEntry[]): 1 | 2 | 3 {
    const distinctDays = new Set(entries.map((e) => this.toDateString(e.date)));
    const count = distinctDays.size;

    if (count >= PHASE_3_THRESHOLD) return 3;
    if (count >= PHASE_2_THRESHOLD) return 2;
    return 1;
  }

  private calculateGoalAdherence(
    entries: SebastianEntry[],
    goals: SebastianGoal[],
  ): number {
    const today = this.toDateString(new Date());
    const todayEntries = entries.filter(
      (e) => this.toDateString(e.date) === today,
    );

    const scores: number[] = [];

    for (const goal of goals) {
      const actual = todayEntries
        .filter((e) => e.category === goal.category)
        .reduce((sum, e) => sum + Number(e.quantity), 0);

      const target = goal.targetQuantity;
      let categoryScore: number;

      if (actual <= target) {
        categoryScore = 100;
      } else {
        categoryScore = Math.max(0, (1 - (actual - target) / target) * 100);
      }

      scores.push(categoryScore);
    }

    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  private calculateTrendBonus(
    entries: SebastianEntry[],
    goals: SebastianGoal[],
  ): number {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000);

    const currentWeek = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= sevenDaysAgo && d <= now;
    });

    const previousWeek = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const bonuses: number[] = [];

    for (const goal of goals) {
      const currentTotal = currentWeek
        .filter((e) => e.category === goal.category)
        .reduce((sum, e) => sum + Number(e.quantity), 0);

      const previousTotal = previousWeek
        .filter((e) => e.category === goal.category)
        .reduce((sum, e) => sum + Number(e.quantity), 0);

      if (previousTotal === 0) {
        bonuses.push(0);
        continue;
      }

      const changeRatio = (currentTotal - previousTotal) / previousTotal;

      if (changeRatio < 0) {
        const magnitude = Math.min(Math.abs(changeRatio), 1);
        bonuses.push(
          TREND_BONUS_MIN + magnitude * (TREND_BONUS_MAX - TREND_BONUS_MIN),
        );
      } else if (changeRatio > 0) {
        const magnitude = Math.min(changeRatio, 1);
        bonuses.push(
          -(TREND_BONUS_MIN + magnitude * (TREND_BONUS_MAX - TREND_BONUS_MIN)),
        );
      } else {
        bonuses.push(0);
      }
    }

    if (bonuses.length === 0) return 0;
    return bonuses.reduce((a, b) => a + b, 0) / bonuses.length;
  }

  private calculateStreaks(
    entries: SebastianEntry[],
    goals: SebastianGoal[],
  ): { alcohol: number; coffee: number } {
    const streaks: { alcohol: number; coffee: number } = {
      alcohol: 0,
      coffee: 0,
    };

    const byDateAndCategory = new Map<string, Map<string, number>>();
    for (const entry of entries) {
      const dateStr = this.toDateString(entry.date);
      if (!byDateAndCategory.has(dateStr)) {
        byDateAndCategory.set(dateStr, new Map());
      }
      const categoryMap = byDateAndCategory.get(dateStr)!;
      categoryMap.set(
        entry.category,
        (categoryMap.get(entry.category) ?? 0) + Number(entry.quantity),
      );
    }

    for (const goal of goals) {
      const category = goal.category;
      let streak = 0;

      for (let i = 0; ; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = this.toDateString(d);

        const dayData = byDateAndCategory.get(dateStr);
        const consumed = dayData?.get(category) ?? 0;

        if (consumed <= goal.targetQuantity) {
          streak++;
        } else {
          break;
        }

        if (i > 365) break;
      }

      streaks[category] = streak;
    }

    return streaks;
  }

  private getMessage(score: number, hasGoals: boolean): string {
    if (!hasGoals) return 'Definis un objectif pour debloquer ton score';
    if (score >= 90) return 'Excellent ! Continue comme ca !';
    if (score >= 70) return 'En bonne voie !';
    if (score >= 50) return 'Peut mieux faire, garde le cap';
    return 'Attention cette semaine';
  }

  private toDateString(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
