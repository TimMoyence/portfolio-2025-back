/* eslint-disable @typescript-eslint/unbound-method */
import { GetPeriodReportUseCase } from './GetPeriodReport.useCase';
import type {
  SebastianCategory,
  SebastianEntry,
} from '../../domain/SebastianEntry';
import {
  buildSebastianEntry,
  createMockSebastianEntryRepo,
} from '../../../../../test/factories/sebastian.factory';

const WEEK_START = '2026-03-02';

function entryOn(
  category: SebastianCategory,
  quantity: number,
  isoDate: string,
): SebastianEntry {
  return buildSebastianEntry({ category, quantity, date: new Date(isoDate) });
}

describe('GetPeriodReportUseCase', () => {
  let useCase: GetPeriodReportUseCase;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;

  beforeEach(() => {
    entryRepo = createMockSebastianEntryRepo();
    useCase = new GetPeriodReportUseCase(entryRepo);
  });

  function givenEntries(
    current: SebastianEntry[],
    previous: SebastianEntry[] = [],
  ): void {
    entryRepo.findByFilters
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(previous);
  }

  function weekReport() {
    return useCase.execute({
      userId: 'user-1',
      period: 'week',
      startDate: WEEK_START,
    });
  }

  describe('heatmap — nombre de jours', () => {
    it('devrait retourner 7 points heatmap pour une periode week', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      const result = await weekReport();

      expect(result.heatmap).toHaveLength(7);
      expect(result.period).toBe('week');
    });

    it('devrait retourner le bon nombre de jours pour une periode month', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'month',
        startDate: '2026-03-01',
      });

      expect(result.heatmap).toHaveLength(31);
    });
  });

  describe('totals', () => {
    it('devrait calculer les totaux correctement', async () => {
      givenEntries([
        entryOn('alcohol', 2, '2026-03-02'),
        entryOn('alcohol', 3, '2026-03-03'),
        entryOn('coffee', 1, '2026-03-04'),
        entryOn('coffee', 4, '2026-03-05'),
      ]);

      const result = await weekReport();

      expect(result.totals.alcohol).toBe(5);
      expect(result.totals.coffee).toBe(5);
    });
  });

  describe('dailyAvg', () => {
    it('devrait calculer les moyennes quotidiennes arrondies a 2 decimales', async () => {
      givenEntries([
        entryOn('alcohol', 3, '2026-03-02'),
        entryOn('coffee', 10, '2026-03-03'),
      ]);

      const result = await weekReport();

      expect(result.dailyAvg.alcohol).toBeCloseTo(0.43, 2);
      expect(result.dailyAvg.coffee).toBeCloseTo(1.43, 2);
    });
  });

  describe('best / worst day', () => {
    it('devrait identifier le jour avec la plus faible consommation combinee (best)', async () => {
      givenEntries([
        entryOn('alcohol', 5, '2026-03-02'),
        entryOn('coffee', 3, '2026-03-02'),
        entryOn('alcohol', 1, '2026-03-04'),
        entryOn('coffee', 0.5, '2026-03-04'),
      ]);

      const result = await weekReport();

      expect(result.best.score).toBe(0);
      expect(result.best.date).toBe('2026-03-03');
    });

    it('devrait identifier le jour avec la plus forte consommation combinee (worst)', async () => {
      givenEntries([
        entryOn('alcohol', 5, '2026-03-02'),
        entryOn('coffee', 3, '2026-03-02'),
        entryOn('alcohol', 1, '2026-03-04'),
      ]);

      const result = await weekReport();

      expect(result.worst.date).toBe('2026-03-02');
      expect(result.worst.score).toBe(8);
    });
  });

  describe('comparison vs periode precedente', () => {
    it('devrait calculer un delta positif quand courant > precedent', async () => {
      givenEntries(
        [
          entryOn('alcohol', 10, '2026-03-02'),
          entryOn('coffee', 20, '2026-03-03'),
        ],
        [
          entryOn('alcohol', 5, '2026-02-23'),
          entryOn('coffee', 10, '2026-02-24'),
        ],
      );

      const result = await weekReport();

      expect(result.comparison.alcoholDelta).toBe(100.0);
      expect(result.comparison.coffeeDelta).toBe(100.0);
    });

    it('devrait calculer un delta negatif quand courant < precedent', async () => {
      givenEntries(
        [
          entryOn('alcohol', 3, '2026-03-02'),
          entryOn('coffee', 5, '2026-03-03'),
        ],
        [
          entryOn('alcohol', 10, '2026-02-23'),
          entryOn('coffee', 20, '2026-02-24'),
        ],
      );

      const result = await weekReport();

      expect(result.comparison.alcoholDelta).toBe(-70.0);
      expect(result.comparison.coffeeDelta).toBe(-75.0);
    });

    it('devrait retourner 0 quand la periode precedente est vide', async () => {
      givenEntries([
        entryOn('alcohol', 5, '2026-03-02'),
        entryOn('coffee', 8, '2026-03-03'),
      ]);

      const result = await weekReport();

      expect(result.comparison.alcoholDelta).toBe(0);
      expect(result.comparison.coffeeDelta).toBe(0);
    });
  });

  describe('distribution par jour de semaine', () => {
    it('devrait regrouper les entrees par jour de semaine correctement', async () => {
      givenEntries([
        entryOn('alcohol', 2, '2026-03-02'),
        entryOn('coffee', 3, '2026-03-02'),
        entryOn('alcohol', 1, '2026-03-04'),
      ]);

      const result = await weekReport();

      expect(result.distribution).toHaveLength(7);

      const monday = result.distribution.find((d) => d.dayOfWeek === 1);
      expect(monday).toBeDefined();
      expect(monday!.alcohol).toBe(2);
      expect(monday!.coffee).toBe(3);

      const wednesday = result.distribution.find((d) => d.dayOfWeek === 3);
      expect(wednesday).toBeDefined();
      expect(wednesday!.alcohol).toBe(1);
      expect(wednesday!.coffee).toBe(0);

      const sunday = result.distribution.find((d) => d.dayOfWeek === 0);
      expect(sunday).toBeDefined();
      expect(sunday!.alcohol).toBe(0);
      expect(sunday!.coffee).toBe(0);
    });
  });

  describe('heatmap — jours sans entrees', () => {
    it('devrait retourner des zeros pour les jours sans entrees', async () => {
      givenEntries([entryOn('alcohol', 3, '2026-03-02')]);

      const result = await weekReport();

      const emptyDay = result.heatmap.find((h) => h.date === '2026-03-03');
      expect(emptyDay).toBeDefined();
      expect(emptyDay!.alcohol).toBe(0);
      expect(emptyDay!.coffee).toBe(0);
      expect(emptyDay!.combined).toBe(0);

      const filledDay = result.heatmap.find((h) => h.date === '2026-03-02');
      expect(filledDay).toBeDefined();
      expect(filledDay!.alcohol).toBe(3);
      expect(filledDay!.coffee).toBe(0);
      expect(filledDay!.combined).toBe(3);
    });
  });

  describe('periode vide', () => {
    it('devrait retourner des zeros et best/worst par defaut au startDate', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      const result = await weekReport();

      expect(result.totals.alcohol).toBe(0);
      expect(result.totals.coffee).toBe(0);
      expect(result.dailyAvg.alcohol).toBe(0);
      expect(result.dailyAvg.coffee).toBe(0);
      expect(result.best.date).toBe(WEEK_START);
      expect(result.best.score).toBe(0);
      expect(result.worst.date).toBe(WEEK_START);
      expect(result.worst.score).toBe(0);
      expect(result.comparison.alcoholDelta).toBe(0);
      expect(result.comparison.coffeeDelta).toBe(0);
      expect(result.distribution).toHaveLength(7);
      expect(result.heatmap).toHaveLength(7);
    });
  });

  it('devrait appeler findByFilters deux fois (courant + precedent)', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);

    await weekReport();

    expect(entryRepo.findByFilters).toHaveBeenCalledTimes(2);
  });

  describe('dates de periode', () => {
    it('devrait calculer endDate correctement pour week', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      const result = await weekReport();

      expect(result.startDate).toBe(WEEK_START);
      expect(result.endDate).toBe('2026-03-08');
    });

    it('devrait calculer endDate correctement pour month', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'month',
        startDate: '2026-03-01',
      });

      expect(result.startDate).toBe('2026-03-01');
      expect(result.endDate).toBe('2026-03-31');
    });

    it('devrait calculer endDate correctement pour quarter', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'quarter',
        startDate: '2026-01-01',
      });

      expect(result.startDate).toBe('2026-01-01');
      expect(result.endDate).toBe('2026-04-01');
    });
  });
});
