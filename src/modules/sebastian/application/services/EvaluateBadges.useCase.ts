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
import {
  BADGE_STRATEGIES,
  subtractDays,
} from '../../domain/badge-rules/badge-strategies';

/**
 * Evalue et debloque les badges pour un utilisateur.
 *
 * Appele apres chaque ajout d'entree (AddEntry) et potentiellement par un cron.
 * L'evaluation de chaque regle est deleguee a une `BadgeStrategy` du domaine
 * (registry `BADGE_STRATEGIES`) ; le use case conserve uniquement
 * l'orchestration (fetch repository + iteration catalogue + persistance).
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
      ? { userId, from: subtractDays(now, 30) }
      : { userId };

    const [entries, goals] = await Promise.all([
      this.entryRepo.findByFilters(entryFilters),
      this.goalRepo.findByUserId(userId),
    ]);

    const context = { entries, goals, now };
    const newBadges: SebastianBadge[] = [];

    for (const catalogEntry of BADGE_CATALOG) {
      if (unlockedKeys.has(catalogEntry.key)) {
        continue;
      }

      const strategy = BADGE_STRATEGIES.get(catalogEntry.key);
      if (!strategy) {
        continue;
      }

      if (strategy.evaluate(context)) {
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
}
