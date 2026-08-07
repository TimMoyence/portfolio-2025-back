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

  private static readonly GLOBAL_HISTORY_BADGES = [
    'first-log',
    'espresso-machine',
    'early-bird',
    'night-owl',
  ];

  async execute(userId: string): Promise<SebastianBadge[]> {
    const now = new Date();

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
