import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianBadgeRepository } from '../../domain/ISebastianBadge.repository';
import type {
  ISebastianEntryRepository,
  SebastianEntryFilters,
} from '../../domain/ISebastianEntry.repository';
import type { ISebastianGoalRepository } from '../../domain/ISebastianGoal.repository';
import {
  SEBASTIAN_BADGE_REPOSITORY,
  SEBASTIAN_ENTRY_REPOSITORY,
  SEBASTIAN_GOAL_REPOSITORY,
} from '../../domain/token';
import { SebastianBadge } from '../../domain/SebastianBadge';
import { BADGE_CATALOG } from '../../domain/badge-catalog';
import type { SebastianEntry } from '../../domain/SebastianEntry';
import type { SebastianGoal } from '../../domain/SebastianGoal';

/**
 * Evalue et debloque les badges pour un utilisateur.
 *
 * Appele apres chaque ajout d'entree (AddEntry) et potentiellement par un cron.
 * Compare les entrees et objectifs de l'utilisateur aux conditions du catalogue
 * de badges et persiste les nouveaux badges debloques.
 */
@Injectable()
export class EvaluateBadgesUseCase {
  constructor(
    @Inject(SEBASTIAN_BADGE_REPOSITORY)
    private readonly badgeRepo: ISebastianBadgeRepository,
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
    @Inject(SEBASTIAN_GOAL_REPOSITORY)
    private readonly goalRepo: ISebastianGoalRepository,
  ) {}

  /** Badges qui necessitent l'historique complet (1-shot, jamais reset une fois debloques). */
  private static readonly GLOBAL_HISTORY_BADGES = [
    'first-log',
    'espresso-machine',
    'early-bird',
    'night-owl',
  ];

  /** Execute l'evaluation des badges et retourne les nouveaux badges debloques. */
  async execute(userId: string): Promise<SebastianBadge[]> {
    const now = new Date();

    // Optimisation N+1 : on charge d'abord les badges existants pour savoir
    // si tous les badges "historique complet" sont deja debloques. Si oui,
    // on limite le fetch d'entrees aux 30 derniers jours (window max des
    // badges restants : zen-monk-30, goal-crusher, perfect-month).
    const existingBadges = await this.badgeRepo.findByUserId(userId);
    const unlockedKeys = new Set(existingBadges.map((b) => b.badgeKey));
    const allGlobalsUnlocked =
      EvaluateBadgesUseCase.GLOBAL_HISTORY_BADGES.every((key) =>
        unlockedKeys.has(key),
      );

    const entryFilters: SebastianEntryFilters = allGlobalsUnlocked
      ? { userId, from: this.subtractDays(now, 30) }
      : { userId };

    const [entries, goals] = await Promise.all([
      this.entryRepo.findByFilters(entryFilters),
      this.goalRepo.findByUserId(userId),
    ]);
    const newBadges: SebastianBadge[] = [];

    for (const catalogEntry of BADGE_CATALOG) {
      if (unlockedKeys.has(catalogEntry.key)) {
        continue;
      }

      const conditionMet = this.evaluateCondition(
        catalogEntry.key,
        entries,
        goals,
        now,
      );

      if (conditionMet) {
        const badge = SebastianBadge.create({
          userId,
          badgeKey: catalogEntry.key,
          category: catalogEntry.category,
        });
        const persisted = await this.badgeRepo.create(badge);
        newBadges.push(persisted);
      }
    }

    return newBadges;
  }

  /** Dispatche l'evaluation vers la methode de condition appropriee. */
  private evaluateCondition(
    key: string,
    entries: SebastianEntry[],
    goals: SebastianGoal[],
    now: Date,
  ): boolean {
    switch (key) {
      case 'first-log':
        return this.evaluateFirstLog(entries);
      case 'zen-monk-7':
        return this.evaluateZenMonk(entries, 7, now);
      case 'zen-monk-30':
        return this.evaluateZenMonk(entries, 30, now);
      case 'espresso-machine':
        return this.evaluateEspressoMachine(entries);
      case 'dry-week':
        return this.evaluateDryWeek(entries, now);
      case 'goal-crusher':
        return this.evaluateGoalCrusher(entries, goals, now);
      case 'early-bird':
        return this.evaluateEarlyBird(entries);
      case 'night-owl':
        return this.evaluateNightOwl(entries);
      case 'perfect-month':
        return this.evaluatePerfectMonth(entries, goals, now);
      case 'comeback-kid':
        return this.evaluateComebackKid(entries, goals, now);
      default:
        return false;
    }
  }

  /** first-log : au moins 1 entree enregistree. */
  private evaluateFirstLog(entries: SebastianEntry[]): boolean {
    return entries.length >= 1;
  }

  /** zen-monk-N : N jours consecutifs en arriere depuis aujourd'hui avec 0 alcool. */
  private evaluateZenMonk(
    entries: SebastianEntry[],
    days: number,
    now: Date,
  ): boolean {
    if (!this.hasEnoughHistory(entries, days, now)) {
      return false;
    }

    const alcoholDates = this.getEntryDateStrings(
      entries.filter((e) => e.category === 'alcohol'),
    );

    for (let i = 0; i < days; i++) {
      const day = this.subtractDays(now, i);
      if (alcoholDates.has(day)) {
        return false;
      }
    }

    return true;
  }

  /** espresso-machine : une journee avec >= 5 cafes (somme des quantites). */
  private evaluateEspressoMachine(entries: SebastianEntry[]): boolean {
    const coffeeEntries = entries.filter((e) => e.category === 'coffee');
    const dailyTotals = new Map<string, number>();

    for (const entry of coffeeEntries) {
      const dateKey = this.toDateString(entry.date);
      dailyTotals.set(
        dateKey,
        (dailyTotals.get(dateKey) ?? 0) + Number(entry.quantity),
      );
    }

    for (const total of dailyTotals.values()) {
      if (total >= 5) {
        return true;
      }
    }

    return false;
  }

  /** dry-week : 0 entrees alcool sur les 7 derniers jours (necessite 7j d'historique). */
  private evaluateDryWeek(entries: SebastianEntry[], now: Date): boolean {
    if (!this.hasEnoughHistory(entries, 7, now)) {
      return false;
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const recentAlcohol = entries.filter(
      (e) => e.category === 'alcohol' && e.date >= sevenDaysAgo,
    );
    return recentAlcohol.length === 0;
  }

  /**
   * goal-crusher : 30 jours consecutifs ou la consommation totale
   * est sous l'objectif quotidien pour TOUTES les categories avec objectif actif.
   */
  private evaluateGoalCrusher(
    entries: SebastianEntry[],
    goals: SebastianGoal[],
    now: Date,
  ): boolean {
    const activeGoals = goals.filter((g) => g.isActive && g.period === 'daily');
    if (activeGoals.length === 0) {
      return false;
    }

    if (!this.hasEnoughHistory(entries, 30, now)) {
      return false;
    }

    return this.evaluateConsecutiveDaysUnderGoal(entries, activeGoals, 30, now);
  }

  /** early-bird : une entree avec createdAt avant 7h. */
  private evaluateEarlyBird(entries: SebastianEntry[]): boolean {
    return entries.some((e) => {
      if (!e.createdAt) return false;
      const hour = e.createdAt.getHours();
      return hour < 7;
    });
  }

  /** night-owl : une entree avec createdAt entre minuit et 5h. */
  private evaluateNightOwl(entries: SebastianEntry[]): boolean {
    return entries.some((e) => {
      if (!e.createdAt) return false;
      const hour = e.createdAt.getHours();
      return hour >= 0 && hour < 5;
    });
  }

  /**
   * perfect-month : 30 jours consecutifs ou TOUTES les categories
   * avec objectif actif sont sous leur cible quotidienne.
   */
  private evaluatePerfectMonth(
    entries: SebastianEntry[],
    goals: SebastianGoal[],
    now: Date,
  ): boolean {
    const activeGoals = goals.filter((g) => g.isActive && g.period === 'daily');
    if (activeGoals.length === 0) {
      return false;
    }

    if (!this.hasEnoughHistory(entries, 30, now)) {
      return false;
    }

    return this.evaluateConsecutiveDaysUnderGoal(entries, activeGoals, 30, now);
  }

  /**
   * comeback-kid : la semaine courante (7 derniers jours) est sous l'objectif
   * ET la semaine precedente (7-14 jours) etait au-dessus, pour au moins une categorie.
   */
  private evaluateComebackKid(
    entries: SebastianEntry[],
    goals: SebastianGoal[],
    now: Date,
  ): boolean {
    const activeGoals = goals.filter((g) => g.isActive && g.period === 'daily');
    if (activeGoals.length === 0) {
      return false;
    }

    if (!this.hasEnoughHistory(entries, 14, now)) {
      return false;
    }

    const currentWeekStart = new Date(now.getTime() - 7 * 86_400_000);
    const previousWeekStart = new Date(now.getTime() - 14 * 86_400_000);

    for (const goal of activeGoals) {
      const currentWeekEntries = entries.filter(
        (e) =>
          e.category === goal.category &&
          e.date >= currentWeekStart &&
          e.date < now,
      );
      const previousWeekEntries = entries.filter(
        (e) =>
          e.category === goal.category &&
          e.date >= previousWeekStart &&
          e.date < currentWeekStart,
      );

      const currentAvg = this.averageQuantity(currentWeekEntries, 7);
      const previousAvg = this.averageQuantity(previousWeekEntries, 7);

      if (
        currentAvg < goal.targetQuantity &&
        previousAvg > goal.targetQuantity
      ) {
        return true;
      }
    }

    return false;
  }

  /** Calcule la moyenne quotidienne des quantites sur un nombre de jours donne. */
  private averageQuantity(entries: SebastianEntry[], days: number): number {
    const total = entries.reduce((sum, e) => sum + Number(e.quantity), 0);
    return total / days;
  }

  /** Verifie N jours consecutifs sous objectif pour toutes les categories. */
  private evaluateConsecutiveDaysUnderGoal(
    entries: SebastianEntry[],
    activeGoals: SebastianGoal[],
    days: number,
    now: Date,
  ): boolean {
    for (let i = 0; i < days; i++) {
      const dayStr = this.subtractDays(now, i);

      for (const goal of activeGoals) {
        const dayEntries = entries.filter(
          (e) =>
            e.category === goal.category &&
            this.toDateString(e.date) === dayStr,
        );
        const dayTotal = dayEntries.reduce(
          (sum, e) => sum + Number(e.quantity),
          0,
        );

        if (dayTotal >= goal.targetQuantity) {
          return false;
        }
      }
    }

    return true;
  }

  /** Retourne un Set de chaines YYYY-MM-DD a partir d'une liste d'entrees. */
  private getEntryDateStrings(entries: SebastianEntry[]): Set<string> {
    return new Set(entries.map((e) => this.toDateString(e.date)));
  }

  /** Convertit une Date en chaine YYYY-MM-DD. */
  private toDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  /** Retourne la chaine YYYY-MM-DD correspondant a N jours avant la date donnee. */
  private subtractDays(date: Date, days: number): string {
    return new Date(date.getTime() - days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  }

  /**
   * Verifie que l'utilisateur a au moins N jours d'historique
   * entre sa premiere entree et maintenant.
   */
  private hasEnoughHistory(
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
    const diffMs = now.getTime() - firstEntryDate.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    return diffDays >= requiredDays;
  }
}
