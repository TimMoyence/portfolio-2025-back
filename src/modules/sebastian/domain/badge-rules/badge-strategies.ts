import type { SebastianEntry } from '../SebastianEntry';
import type { SebastianGoal } from '../SebastianGoal';

interface BadgeEvaluationContext {
  entries: SebastianEntry[];
  goals: SebastianGoal[];
  now: Date;
}

export const FULL_HISTORY = 'full-history';

export type BadgeWindow = number | typeof FULL_HISTORY;

export interface BadgeStrategy {
  readonly key: string;

  readonly evaluationWindow: BadgeWindow;

  evaluate(context: BadgeEvaluationContext): boolean;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function subtractDays(date: Date, days: number): string {
  return new Date(date.getTime() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function entryDateStrings(entries: SebastianEntry[]): Set<string> {
  return new Set(entries.map((e) => toDateString(e.date)));
}

function hasEnoughHistory(
  entries: SebastianEntry[],
  requiredDays: number,
  now: Date,
): boolean {
  if (entries.length === 0) {
    return false;
  }
  const firstEntryDate = entries.reduce(
    (min, e) => (e.date < min ? e.date : min),
    entries[0].date,
  );
  const diffDays = Math.floor(
    (now.getTime() - firstEntryDate.getTime()) / 86_400_000,
  );
  return diffDays >= requiredDays;
}

function consecutiveDaysUnderGoal(
  entries: SebastianEntry[],
  activeGoals: SebastianGoal[],
  days: number,
  now: Date,
): boolean {
  for (let i = 0; i < days; i++) {
    const dayStr = subtractDays(now, i);
    for (const goal of activeGoals) {
      const dayTotal = entries
        .filter(
          (e) =>
            e.category === goal.category && toDateString(e.date) === dayStr,
        )
        .reduce((sum, e) => sum + Number(e.quantity), 0);
      if (dayTotal >= goal.targetQuantity) {
        return false;
      }
    }
  }
  return true;
}

class FirstLogStrategy implements BadgeStrategy {
  readonly key = 'first-log';
  readonly evaluationWindow = FULL_HISTORY;
  evaluate({ entries }: BadgeEvaluationContext): boolean {
    return entries.length >= 1;
  }
}

class ZenMonkStrategy implements BadgeStrategy {
  constructor(
    readonly key: string,
    readonly evaluationWindow: number,
  ) {}

  evaluate({ entries, now }: BadgeEvaluationContext): boolean {
    if (!hasEnoughHistory(entries, this.evaluationWindow, now)) return false;
    const alcoholDates = entryDateStrings(
      entries.filter((e) => e.category === 'alcohol'),
    );
    for (let i = 0; i < this.evaluationWindow; i++) {
      if (alcoholDates.has(subtractDays(now, i))) return false;
    }
    return true;
  }
}

class EspressoMachineStrategy implements BadgeStrategy {
  readonly key = 'espresso-machine';
  readonly evaluationWindow = FULL_HISTORY;
  evaluate({ entries }: BadgeEvaluationContext): boolean {
    const coffeeEntries = entries.filter((e) => e.category === 'coffee');
    const dailyTotals = new Map<string, number>();
    for (const entry of coffeeEntries) {
      const dateKey = toDateString(entry.date);
      dailyTotals.set(
        dateKey,
        (dailyTotals.get(dateKey) ?? 0) + Number(entry.quantity),
      );
    }
    return Array.from(dailyTotals.values()).some((total) => total >= 5);
  }
}

class DryWeekStrategy implements BadgeStrategy {
  readonly key = 'dry-week';
  readonly evaluationWindow = 7;
  evaluate({ entries, now }: BadgeEvaluationContext): boolean {
    if (!hasEnoughHistory(entries, this.evaluationWindow, now)) return false;
    const windowStart = new Date(
      now.getTime() - this.evaluationWindow * 86_400_000,
    );
    return (
      entries.filter((e) => e.category === 'alcohol' && e.date >= windowStart)
        .length === 0
    );
  }
}

class DailyGoalStreakStrategy implements BadgeStrategy {
  constructor(
    readonly key: string,
    readonly evaluationWindow: number,
  ) {}

  evaluate({ entries, goals, now }: BadgeEvaluationContext): boolean {
    const activeGoals = goals.filter((g) => g.isActive && g.period === 'daily');
    if (activeGoals.length === 0) return false;
    if (!hasEnoughHistory(entries, this.evaluationWindow, now)) return false;
    return consecutiveDaysUnderGoal(
      entries,
      activeGoals,
      this.evaluationWindow,
      now,
    );
  }
}

class EarlyBirdStrategy implements BadgeStrategy {
  readonly key = 'early-bird';
  readonly evaluationWindow = FULL_HISTORY;
  evaluate({ entries }: BadgeEvaluationContext): boolean {
    return entries.some((e) => {
      if (!e.createdAt) return false;
      return e.createdAt.getHours() < 7;
    });
  }
}

class NightOwlStrategy implements BadgeStrategy {
  readonly key = 'night-owl';
  readonly evaluationWindow = FULL_HISTORY;
  evaluate({ entries }: BadgeEvaluationContext): boolean {
    return entries.some((e) => {
      if (!e.createdAt) return false;
      const hour = e.createdAt.getHours();
      return hour >= 0 && hour < 5;
    });
  }
}

const COMEBACK_COMPARED_SPAN_DAYS = 7;

class ComebackKidStrategy implements BadgeStrategy {
  readonly key = 'comeback-kid';
  readonly evaluationWindow = COMEBACK_COMPARED_SPAN_DAYS * 2;
  evaluate({ entries, goals, now }: BadgeEvaluationContext): boolean {
    const activeGoals = goals.filter((g) => g.isActive && g.period === 'daily');
    if (activeGoals.length === 0) return false;
    if (!hasEnoughHistory(entries, this.evaluationWindow, now)) return false;

    const currentWeekStart = new Date(
      now.getTime() - COMEBACK_COMPARED_SPAN_DAYS * 86_400_000,
    );
    const previousWeekStart = new Date(
      now.getTime() - this.evaluationWindow * 86_400_000,
    );

    for (const goal of activeGoals) {
      const currentWeek = entries.filter(
        (e) =>
          e.category === goal.category &&
          e.date >= currentWeekStart &&
          e.date < now,
      );
      const previousWeek = entries.filter(
        (e) =>
          e.category === goal.category &&
          e.date >= previousWeekStart &&
          e.date < currentWeekStart,
      );
      const currentAvg =
        currentWeek.reduce((sum, e) => sum + Number(e.quantity), 0) /
        COMEBACK_COMPARED_SPAN_DAYS;
      const previousAvg =
        previousWeek.reduce((sum, e) => sum + Number(e.quantity), 0) /
        COMEBACK_COMPARED_SPAN_DAYS;

      if (
        currentAvg < goal.targetQuantity &&
        previousAvg > goal.targetQuantity
      ) {
        return true;
      }
    }
    return false;
  }
}

export const BADGE_STRATEGIES: ReadonlyMap<string, BadgeStrategy> = new Map<
  string,
  BadgeStrategy
>([
  ['first-log', new FirstLogStrategy()],
  ['zen-monk-7', new ZenMonkStrategy('zen-monk-7', 7)],
  ['zen-monk-30', new ZenMonkStrategy('zen-monk-30', 30)],
  ['espresso-machine', new EspressoMachineStrategy()],
  ['dry-week', new DryWeekStrategy()],
  ['goal-crusher', new DailyGoalStreakStrategy('goal-crusher', 30)],
  ['early-bird', new EarlyBirdStrategy()],
  ['night-owl', new NightOwlStrategy()],
  ['perfect-month', new DailyGoalStreakStrategy('perfect-month', 30)],
  ['comeback-kid', new ComebackKidStrategy()],
]);

export function maxBadgeWindowDays(
  strategies: ReadonlyMap<string, BadgeStrategy>,
): number {
  let max = 0;
  for (const { evaluationWindow } of strategies.values()) {
    if (evaluationWindow !== FULL_HISTORY && evaluationWindow > max) {
      max = evaluationWindow;
    }
  }
  return max;
}

export function fullHistoryBadgeKeys(
  strategies: ReadonlyMap<string, BadgeStrategy>,
): string[] {
  return Array.from(strategies.values())
    .filter((strategy) => strategy.evaluationWindow === FULL_HISTORY)
    .map((strategy) => strategy.key);
}
