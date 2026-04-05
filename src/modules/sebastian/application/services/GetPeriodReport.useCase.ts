import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import { SEBASTIAN_ENTRY_REPOSITORY } from '../../domain/token';
import type { GetPeriodReportQuery } from '../dto/GetPeriodReport.query';
import type { SebastianEntry } from '../../domain/SebastianEntry';

/** Distribution de consommation par jour de semaine. */
export interface DayDistribution {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  alcohol: number;
  coffee: number;
}

/** Point de la carte thermique journaliere. */
export interface HeatmapPoint {
  date: string; // YYYY-MM-DD
  alcohol: number;
  coffee: number;
  combined: number;
}

/** Resultat complet du rapport de periode. */
export interface PeriodReportResult {
  period: 'week' | 'month' | 'quarter';
  startDate: string;
  endDate: string;
  totals: { alcohol: number; coffee: number };
  dailyAvg: { alcohol: number; coffee: number };
  best: { date: string; score: number };
  worst: { date: string; score: number };
  comparison: { alcoholDelta: number; coffeeDelta: number };
  distribution: DayDistribution[];
  heatmap: HeatmapPoint[];
}

/**
 * Genere un rapport detaille pour une periode donnee (semaine, mois, trimestre).
 *
 * Calcule les totaux, moyennes, meilleur/pire jour, comparaison avec la
 * periode precedente, distribution par jour de semaine et carte thermique.
 */
@Injectable()
export class GetPeriodReportUseCase {
  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
  ) {}

  /** Execute la generation du rapport de periode. */
  async execute(query: GetPeriodReportQuery): Promise<PeriodReportResult> {
    const { startDate, endDate, previousStart, previousEnd, dayCount } =
      this.computeDateRanges(query.startDate, query.period);

    const [currentEntries, previousEntries] = await Promise.all([
      this.entryRepo.findByFilters({
        userId: query.userId,
        from: startDate,
        to: endDate,
      }),
      this.entryRepo.findByFilters({
        userId: query.userId,
        from: previousStart,
        to: previousEnd,
      }),
    ]);

    const totals = this.computeTotals(currentEntries);
    const dailyAvg = this.computeDailyAvg(totals, dayCount);
    const heatmap = this.buildHeatmap(startDate, dayCount, currentEntries);
    const { best, worst } = this.findBestWorst(heatmap, startDate);
    const comparison = this.computeComparison(totals, previousEntries);
    const distribution = this.buildDistribution(currentEntries);

    return {
      period: query.period,
      startDate,
      endDate,
      totals,
      dailyAvg,
      best,
      worst,
      comparison,
      distribution,
      heatmap,
    };
  }

  /**
   * Calcule les plages de dates pour la periode courante et la precedente.
   */
  private computeDateRanges(
    startDateStr: string,
    period: 'week' | 'month' | 'quarter',
  ): {
    startDate: string;
    endDate: string;
    previousStart: string;
    previousEnd: string;
    dayCount: number;
  } {
    const start = this.parseDate(startDateStr);
    let end: Date;

    if (period === 'week') {
      end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
    } else if (period === 'month') {
      end = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
      );
    } else {
      // quarter : +3 mois
      end = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth() + 3,
          start.getUTCDate(),
        ),
      );
    }

    const dayCount = this.daysBetween(start, end) + 1;

    // Periode precedente : meme duree, finissant la veille du startDate
    const prevEnd = new Date(start);
    prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setUTCDate(prevStart.getUTCDate() - (dayCount - 1));

    return {
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
      previousStart: this.formatDate(prevStart),
      previousEnd: this.formatDate(prevEnd),
      dayCount,
    };
  }

  /** Calcule les totaux par categorie. */
  private computeTotals(entries: SebastianEntry[]): {
    alcohol: number;
    coffee: number;
  } {
    let alcohol = 0;
    let coffee = 0;

    for (const entry of entries) {
      const qty = Number(entry.quantity);
      if (entry.category === 'alcohol') {
        alcohol += qty;
      } else if (entry.category === 'coffee') {
        coffee += qty;
      }
    }

    return { alcohol, coffee };
  }

  /** Calcule les moyennes quotidiennes arrondies a 2 decimales. */
  private computeDailyAvg(
    totals: { alcohol: number; coffee: number },
    dayCount: number,
  ): { alcohol: number; coffee: number } {
    if (dayCount === 0) return { alcohol: 0, coffee: 0 };

    return {
      alcohol: Math.round((totals.alcohol / dayCount) * 100) / 100,
      coffee: Math.round((totals.coffee / dayCount) * 100) / 100,
    };
  }

  /** Construit la carte thermique jour par jour. */
  private buildHeatmap(
    startDateStr: string,
    dayCount: number,
    entries: SebastianEntry[],
  ): HeatmapPoint[] {
    const dateMap = new Map<string, { alcohol: number; coffee: number }>();

    for (const entry of entries) {
      const dateKey = this.formatDate(entry.date);
      const existing = dateMap.get(dateKey) ?? { alcohol: 0, coffee: 0 };
      const qty = Number(entry.quantity);

      if (entry.category === 'alcohol') {
        existing.alcohol += qty;
      } else if (entry.category === 'coffee') {
        existing.coffee += qty;
      }

      dateMap.set(dateKey, existing);
    }

    const heatmap: HeatmapPoint[] = [];
    const current = this.parseDate(startDateStr);

    for (let i = 0; i < dayCount; i++) {
      const dateStr = this.formatDate(current);
      const data = dateMap.get(dateStr) ?? { alcohol: 0, coffee: 0 };
      heatmap.push({
        date: dateStr,
        alcohol: data.alcohol,
        coffee: data.coffee,
        combined: data.alcohol + data.coffee,
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return heatmap;
  }

  /** Identifie le meilleur (consommation min) et le pire (consommation max) jour. */
  private findBestWorst(
    heatmap: HeatmapPoint[],
    fallbackDate: string,
  ): {
    best: { date: string; score: number };
    worst: { date: string; score: number };
  } {
    if (heatmap.length === 0) {
      return {
        best: { date: fallbackDate, score: 0 },
        worst: { date: fallbackDate, score: 0 },
      };
    }

    let best = { date: heatmap[0].date, score: heatmap[0].combined };
    let worst = { date: heatmap[0].date, score: heatmap[0].combined };

    for (const point of heatmap) {
      if (point.combined < best.score) {
        best = { date: point.date, score: point.combined };
      }
      if (point.combined > worst.score) {
        worst = { date: point.date, score: point.combined };
      }
    }

    return { best, worst };
  }

  /** Calcule la variation en pourcentage vs la periode precedente (arrondi 1 decimale). */
  private computeComparison(
    currentTotals: { alcohol: number; coffee: number },
    previousEntries: SebastianEntry[],
  ): { alcoholDelta: number; coffeeDelta: number } {
    const prevTotals = this.computeTotals(previousEntries);

    const alcoholDelta =
      prevTotals.alcohol > 0
        ? Math.round(
            ((currentTotals.alcohol - prevTotals.alcohol) /
              prevTotals.alcohol) *
              1000,
          ) / 10
        : 0;

    const coffeeDelta =
      prevTotals.coffee > 0
        ? Math.round(
            ((currentTotals.coffee - prevTotals.coffee) / prevTotals.coffee) *
              1000,
          ) / 10
        : 0;

    return { alcoholDelta, coffeeDelta };
  }

  /** Construit la distribution par jour de semaine (0=dimanche ... 6=samedi). */
  private buildDistribution(entries: SebastianEntry[]): DayDistribution[] {
    const dist: DayDistribution[] = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      alcohol: 0,
      coffee: 0,
    }));

    for (const entry of entries) {
      const dayOfWeek = entry.date.getUTCDay();
      const qty = Number(entry.quantity);

      if (entry.category === 'alcohol') {
        dist[dayOfWeek].alcohol += qty;
      } else if (entry.category === 'coffee') {
        dist[dayOfWeek].coffee += qty;
      }
    }

    return dist;
  }

  /** Parse une date YYYY-MM-DD en UTC. */
  private parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  /** Formate une date en YYYY-MM-DD. */
  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date.slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  }

  /** Calcule le nombre de jours entre deux dates. */
  private daysBetween(a: Date, b: Date): number {
    const msPerDay = 86_400_000;
    return Math.round((b.getTime() - a.getTime()) / msPerDay);
  }
}
