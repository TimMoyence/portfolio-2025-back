/* eslint-disable @typescript-eslint/unbound-method */
import { GetPeriodReportUseCase } from './GetPeriodReport.useCase';
import {
  buildSebastianEntry,
  createMockSebastianEntryRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('GetPeriodReportUseCase', () => {
  let useCase: GetPeriodReportUseCase;
  let entryRepo: ReturnType<typeof createMockSebastianEntryRepo>;

  beforeEach(() => {
    entryRepo = createMockSebastianEntryRepo();
    useCase = new GetPeriodReportUseCase(entryRepo);
  });

  describe('heatmap — nombre de jours', () => {
    it('devrait retourner 7 points heatmap pour une periode week', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      expect(result.heatmap).toHaveLength(7);
      expect(result.period).toBe('week');
    });

    it('devrait retourner le bon nombre de jours pour une periode month', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      // Mars 2026 a 31 jours
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
      const entries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 2,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 3,
          date: new Date('2026-03-03'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 1,
          date: new Date('2026-03-04'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 4,
          date: new Date('2026-03-05'),
        }),
      ];

      entryRepo.findByFilters
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      expect(result.totals.alcohol).toBe(5);
      expect(result.totals.coffee).toBe(5);
    });
  });

  describe('dailyAvg', () => {
    it('devrait calculer les moyennes quotidiennes arrondies a 2 decimales', async () => {
      const entries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 3,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 10,
          date: new Date('2026-03-03'),
        }),
      ];

      entryRepo.findByFilters
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      // 3 / 7 = 0.428... → 0.43
      expect(result.dailyAvg.alcohol).toBe(0.43);
      // 10 / 7 = 1.428... → 1.43
      expect(result.dailyAvg.coffee).toBe(1.43);
    });
  });

  describe('best / worst day', () => {
    it('devrait identifier le jour avec la plus faible consommation combinee (best)', async () => {
      const entries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 5,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 3,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 1,
          date: new Date('2026-03-04'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 0.5,
          date: new Date('2026-03-04'),
        }),
      ];

      entryRepo.findByFilters
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      // Jours sans entrees ont un score de 0, donc le best = premier jour sans entrees
      // 2026-03-03 est le premier jour sans entrees (score 0)
      expect(result.best.score).toBe(0);
      expect(result.best.date).toBe('2026-03-03');
    });

    it('devrait identifier le jour avec la plus forte consommation combinee (worst)', async () => {
      const entries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 5,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 3,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 1,
          date: new Date('2026-03-04'),
        }),
      ];

      entryRepo.findByFilters
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      // 2026-03-02 : alcohol=5 + coffee=3 = 8
      expect(result.worst.date).toBe('2026-03-02');
      expect(result.worst.score).toBe(8);
    });
  });

  describe('comparison vs periode precedente', () => {
    it('devrait calculer un delta positif quand courant > precedent', async () => {
      const currentEntries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 10,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 20,
          date: new Date('2026-03-03'),
        }),
      ];
      const previousEntries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 5,
          date: new Date('2026-02-23'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 10,
          date: new Date('2026-02-24'),
        }),
      ];

      entryRepo.findByFilters
        .mockResolvedValueOnce(currentEntries)
        .mockResolvedValueOnce(previousEntries);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      // (10 - 5) / 5 * 100 = 100.0
      expect(result.comparison.alcoholDelta).toBe(100.0);
      // (20 - 10) / 10 * 100 = 100.0
      expect(result.comparison.coffeeDelta).toBe(100.0);
    });

    it('devrait calculer un delta negatif quand courant < precedent', async () => {
      const currentEntries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 3,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 5,
          date: new Date('2026-03-03'),
        }),
      ];
      const previousEntries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 10,
          date: new Date('2026-02-23'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 20,
          date: new Date('2026-02-24'),
        }),
      ];

      entryRepo.findByFilters
        .mockResolvedValueOnce(currentEntries)
        .mockResolvedValueOnce(previousEntries);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      // (3 - 10) / 10 * 100 = -70.0
      expect(result.comparison.alcoholDelta).toBe(-70.0);
      // (5 - 20) / 20 * 100 = -75.0
      expect(result.comparison.coffeeDelta).toBe(-75.0);
    });

    it('devrait retourner 0 quand la periode precedente est vide', async () => {
      const currentEntries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 5,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 8,
          date: new Date('2026-03-03'),
        }),
      ];

      entryRepo.findByFilters
        .mockResolvedValueOnce(currentEntries)
        .mockResolvedValueOnce([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      expect(result.comparison.alcoholDelta).toBe(0);
      expect(result.comparison.coffeeDelta).toBe(0);
    });
  });

  describe('distribution par jour de semaine', () => {
    it('devrait regrouper les entrees par jour de semaine correctement', async () => {
      // 2026-03-02 est un lundi (dayOfWeek = 1)
      // 2026-03-04 est un mercredi (dayOfWeek = 3)
      const entries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 2,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'coffee',
          quantity: 3,
          date: new Date('2026-03-02'),
        }),
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 1,
          date: new Date('2026-03-04'),
        }),
      ];

      entryRepo.findByFilters
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      expect(result.distribution).toHaveLength(7);

      const monday = result.distribution.find((d) => d.dayOfWeek === 1);
      expect(monday).toBeDefined();
      expect(monday!.alcohol).toBe(2);
      expect(monday!.coffee).toBe(3);

      const wednesday = result.distribution.find((d) => d.dayOfWeek === 3);
      expect(wednesday).toBeDefined();
      expect(wednesday!.alcohol).toBe(1);
      expect(wednesday!.coffee).toBe(0);

      // Dimanche sans entrees
      const sunday = result.distribution.find((d) => d.dayOfWeek === 0);
      expect(sunday).toBeDefined();
      expect(sunday!.alcohol).toBe(0);
      expect(sunday!.coffee).toBe(0);
    });
  });

  describe('heatmap — jours sans entrees', () => {
    it('devrait retourner des zeros pour les jours sans entrees', async () => {
      const entries = [
        buildSebastianEntry({
          category: 'alcohol',
          quantity: 3,
          date: new Date('2026-03-02'),
        }),
      ];

      entryRepo.findByFilters
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

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

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      expect(result.totals.alcohol).toBe(0);
      expect(result.totals.coffee).toBe(0);
      expect(result.dailyAvg.alcohol).toBe(0);
      expect(result.dailyAvg.coffee).toBe(0);
      expect(result.best.date).toBe('2026-03-02');
      expect(result.best.score).toBe(0);
      expect(result.worst.date).toBe('2026-03-02');
      expect(result.worst.score).toBe(0);
      expect(result.comparison.alcoholDelta).toBe(0);
      expect(result.comparison.coffeeDelta).toBe(0);
      expect(result.distribution).toHaveLength(7);
      expect(result.heatmap).toHaveLength(7);
    });
  });

  it('devrait appeler findByFilters deux fois (courant + precedent)', async () => {
    entryRepo.findByFilters.mockResolvedValue([]);

    await useCase.execute({
      userId: 'user-1',
      period: 'week',
      startDate: '2026-03-02',
    });

    expect(entryRepo.findByFilters).toHaveBeenCalledTimes(2);
  });

  describe('dates de periode', () => {
    it('devrait calculer endDate correctement pour week', async () => {
      entryRepo.findByFilters.mockResolvedValue([]);

      const result = await useCase.execute({
        userId: 'user-1',
        period: 'week',
        startDate: '2026-03-02',
      });

      expect(result.startDate).toBe('2026-03-02');
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
