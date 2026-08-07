import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianBadgeRepository } from '../../domain/ISebastianBadge.repository';
import { SEBASTIAN_BADGE_REPOSITORY } from '../../domain/token';
import { BADGE_CATALOG } from '../../domain/badge-catalog';

export interface BadgeStatusResult {
  key: string;
  name: string;
  description: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
}

@Injectable()
export class ListBadgesUseCase {
  constructor(
    @Inject(SEBASTIAN_BADGE_REPOSITORY)
    private readonly badgeRepo: ISebastianBadgeRepository,
  ) {}

  async execute(userId: string): Promise<BadgeStatusResult[]> {
    const userBadges = await this.badgeRepo.findByUserId(userId);
    const badgeMap = new Map(userBadges.map((b) => [b.badgeKey, b]));

    return BADGE_CATALOG.map((catalogEntry) => {
      const userBadge = badgeMap.get(catalogEntry.key);

      return {
        key: catalogEntry.key,
        name: catalogEntry.name,
        description: catalogEntry.description,
        category: catalogEntry.category,
        unlocked: !!userBadge,
        ...(userBadge
          ? { unlockedAt: userBadge.unlockedAt.toISOString() }
          : {}),
      };
    });
  }
}
