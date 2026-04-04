import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import { SEBASTIAN_ENTRY_REPOSITORY } from '../../domain/token';
import type { GetStatsQuery } from '../dto/GetStats.query';

/** Resultat de statistiques pour une categorie. */
export interface CategoryStats {
  category: string;
  total: number;
  average: number;
  trend: number;
}

/** Resultat global des statistiques de consommation. */
export interface StatsResult {
  byCategory: CategoryStats[];
  period: string;
}

/** Nombre de jours par type de periode. */
const PERIOD_DAYS: Record<string, number> = {
  week: 7,
  month: 30,
  year: 365,
};

/**
 * Calcule les statistiques de consommation pour un utilisateur.
 *
 * Recupere les entrees selon la periode, calcule la somme par categorie,
 * la moyenne quotidienne, et la tendance (comparaison periode courante
 * vs precedente en pourcentage).
 */
@Injectable()
export class GetStatsUseCase {
  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
  ) {}

  /** Execute le calcul des statistiques de consommation. */
  async execute(query: GetStatsQuery): Promise<StatsResult> {
    const days = PERIOD_DAYS[query.period];
    const now = new Date();

    const currentEnd = now.toISOString().slice(0, 10);
    const currentStart = new Date(now.getTime() - days * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const previousStart = new Date(now.getTime() - 2 * days * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const [currentEntries, previousEntries] = await Promise.all([
      this.entryRepo.findByFilters({
        userId: query.userId,
        from: currentStart,
        to: currentEnd,
      }),
      this.entryRepo.findByFilters({
        userId: query.userId,
        from: previousStart,
        to: currentStart,
      }),
    ]);

    const currentTotals = new Map<string, number>();
    for (const entry of currentEntries) {
      const key = entry.category;
      currentTotals.set(
        key,
        (currentTotals.get(key) ?? 0) + Number(entry.quantity),
      );
    }

    const previousTotals = new Map<string, number>();
    for (const entry of previousEntries) {
      const key = entry.category;
      previousTotals.set(
        key,
        (previousTotals.get(key) ?? 0) + Number(entry.quantity),
      );
    }

    const allCategories = new Set([
      ...currentTotals.keys(),
      ...previousTotals.keys(),
    ]);

    const byCategory: CategoryStats[] = Array.from(allCategories).map(
      (category) => {
        const total = currentTotals.get(category) ?? 0;
        const previousTotal = previousTotals.get(category) ?? 0;
        const average = days > 0 ? Math.round((total / days) * 100) / 100 : 0;
        const trend =
          previousTotal > 0
            ? Math.round(((total - previousTotal) / previousTotal) * 100)
            : 0;

        return { category, total, average, trend };
      },
    );

    return { byCategory, period: query.period };
  }
}
