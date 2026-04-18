import type { SebastianEntry } from '../SebastianEntry';
import type { SebastianGoal } from '../SebastianGoal';

/**
 * Contexte d'evaluation commun a toutes les strategies de badges.
 * Fourni par le use case applicatif (EvaluateBadges) a chaque appel.
 */
export interface BadgeEvaluationContext {
  entries: SebastianEntry[];
  goals: SebastianGoal[];
  now: Date;
}

/**
 * Strategie DDD d'evaluation d'un badge. Chaque regle metier est une
 * implementation autonome — testable en isolation et extensible sans
 * modifier le use case applicatif (principe OCP).
 *
 * Appartient au domaine : aucune dependance framework/infrastructure.
 */
export interface BadgeStrategy {
  /** Clef unique du badge dans le catalogue (colle au BADGE_CATALOG). */
  readonly key: string;

  /**
   * Evalue si les conditions du badge sont remplies pour l'utilisateur
   * dont le contexte est fourni. Implementation pure : aucune I/O, aucun
   * appel repository, pas de mutation du contexte.
   */
  evaluate(context: BadgeEvaluationContext): boolean;
}

/** Convertit une Date en chaine YYYY-MM-DD (locale UTC). */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Retourne la chaine YYYY-MM-DD correspondant a N jours avant la date donnee. */
export function subtractDays(date: Date, days: number): string {
  return new Date(date.getTime() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** Set des chaines YYYY-MM-DD correspondant aux entrees fournies. */
export function entryDateStrings(entries: SebastianEntry[]): Set<string> {
  return new Set(entries.map((e) => toDateString(e.date)));
}

/**
 * Verifie que l'utilisateur dispose d'au moins `requiredDays` jours entre
 * sa premiere entree et maintenant. Evite de debloquer un badge "30 jours
 * zen" apres 3 jours sans alcool sur un compte qui n'a pas encore 30 jours
 * d'historique.
 */
export function hasEnoughHistory(
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

/**
 * Verifie `days` jours consecutifs sous objectif quotidien pour toutes
 * les categories actives. Factorise la logique de `goal-crusher` et
 * `perfect-month` qui partagent la meme condition.
 */
export function consecutiveDaysUnderGoal(
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

// ---------------------------------------------------------------------------
// Strategies concretes
// ---------------------------------------------------------------------------

/** first-log : au moins 1 entree enregistree. */
class FirstLogStrategy implements BadgeStrategy {
  readonly key = 'first-log';
  evaluate({ entries }: BadgeEvaluationContext): boolean {
    return entries.length >= 1;
  }
}

/**
 * zen-monk-N : N jours consecutifs en arriere depuis aujourd'hui avec
 * 0 alcool. Necessite au moins N jours d'historique pour prevenir
 * le deblocage premature.
 */
class ZenMonkStrategy implements BadgeStrategy {
  constructor(
    readonly key: string,
    private readonly days: number,
  ) {}

  evaluate({ entries, now }: BadgeEvaluationContext): boolean {
    if (!hasEnoughHistory(entries, this.days, now)) return false;
    const alcoholDates = entryDateStrings(
      entries.filter((e) => e.category === 'alcohol'),
    );
    for (let i = 0; i < this.days; i++) {
      if (alcoholDates.has(subtractDays(now, i))) return false;
    }
    return true;
  }
}

/** espresso-machine : une journee avec >= 5 cafes (somme des quantites). */
class EspressoMachineStrategy implements BadgeStrategy {
  readonly key = 'espresso-machine';
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

/**
 * dry-week : 0 entrees alcool sur les 7 derniers jours. Necessite
 * 7 jours d'historique.
 */
class DryWeekStrategy implements BadgeStrategy {
  readonly key = 'dry-week';
  evaluate({ entries, now }: BadgeEvaluationContext): boolean {
    if (!hasEnoughHistory(entries, 7, now)) return false;
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    return (
      entries.filter((e) => e.category === 'alcohol' && e.date >= sevenDaysAgo)
        .length === 0
    );
  }
}

/**
 * goal-crusher : 30 jours consecutifs sous objectif quotidien pour toutes
 * les categories avec objectif actif.
 */
class GoalCrusherStrategy implements BadgeStrategy {
  readonly key = 'goal-crusher';
  evaluate({ entries, goals, now }: BadgeEvaluationContext): boolean {
    const activeGoals = goals.filter((g) => g.isActive && g.period === 'daily');
    if (activeGoals.length === 0) return false;
    if (!hasEnoughHistory(entries, 30, now)) return false;
    return consecutiveDaysUnderGoal(entries, activeGoals, 30, now);
  }
}

/** early-bird : une entree avec createdAt avant 7h. */
class EarlyBirdStrategy implements BadgeStrategy {
  readonly key = 'early-bird';
  evaluate({ entries }: BadgeEvaluationContext): boolean {
    return entries.some((e) => {
      if (!e.createdAt) return false;
      return e.createdAt.getHours() < 7;
    });
  }
}

/** night-owl : une entree avec createdAt entre minuit et 5h. */
class NightOwlStrategy implements BadgeStrategy {
  readonly key = 'night-owl';
  evaluate({ entries }: BadgeEvaluationContext): boolean {
    return entries.some((e) => {
      if (!e.createdAt) return false;
      const hour = e.createdAt.getHours();
      return hour >= 0 && hour < 5;
    });
  }
}

/**
 * perfect-month : identique a goal-crusher mais label different — garde
 * 2 strategies separees (meme condition, progression diff dans le futur).
 */
class PerfectMonthStrategy implements BadgeStrategy {
  readonly key = 'perfect-month';
  evaluate({ entries, goals, now }: BadgeEvaluationContext): boolean {
    const activeGoals = goals.filter((g) => g.isActive && g.period === 'daily');
    if (activeGoals.length === 0) return false;
    if (!hasEnoughHistory(entries, 30, now)) return false;
    return consecutiveDaysUnderGoal(entries, activeGoals, 30, now);
  }
}

/**
 * comeback-kid : semaine courante sous objectif ET semaine precedente au-dessus,
 * pour au moins une categorie avec objectif actif.
 */
class ComebackKidStrategy implements BadgeStrategy {
  readonly key = 'comeback-kid';
  evaluate({ entries, goals, now }: BadgeEvaluationContext): boolean {
    const activeGoals = goals.filter((g) => g.isActive && g.period === 'daily');
    if (activeGoals.length === 0) return false;
    if (!hasEnoughHistory(entries, 14, now)) return false;

    const currentWeekStart = new Date(now.getTime() - 7 * 86_400_000);
    const previousWeekStart = new Date(now.getTime() - 14 * 86_400_000);

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
        currentWeek.reduce((sum, e) => sum + Number(e.quantity), 0) / 7;
      const previousAvg =
        previousWeek.reduce((sum, e) => sum + Number(e.quantity), 0) / 7;

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

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Registry statique de toutes les strategies de badges disponibles.
 * Une seule source de verite : ajouter un nouveau badge = ajouter une
 * ligne dans ce registry + une classe au-dessus + une entree dans
 * BADGE_CATALOG.
 */
export const BADGE_STRATEGIES: ReadonlyMap<string, BadgeStrategy> = new Map<
  string,
  BadgeStrategy
>([
  ['first-log', new FirstLogStrategy()],
  ['zen-monk-7', new ZenMonkStrategy('zen-monk-7', 7)],
  ['zen-monk-30', new ZenMonkStrategy('zen-monk-30', 30)],
  ['espresso-machine', new EspressoMachineStrategy()],
  ['dry-week', new DryWeekStrategy()],
  ['goal-crusher', new GoalCrusherStrategy()],
  ['early-bird', new EarlyBirdStrategy()],
  ['night-owl', new NightOwlStrategy()],
  ['perfect-month', new PerfectMonthStrategy()],
  ['comeback-kid', new ComebackKidStrategy()],
]);
