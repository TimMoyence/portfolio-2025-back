import { BacCalculator } from './BacCalculator';
import type { SebastianEntry } from './SebastianEntry';
import type { SebastianProfile } from './SebastianProfile';
import {
  buildSebastianEntry,
  buildSebastianProfile,
} from '../../../../test/factories/sebastian.factory';

describe('BacCalculator', () => {
  const defaultProfile: SebastianProfile = buildSebastianProfile({
    weightKg: 70,
    widmarkR: 0.68,
  });

  /** Helper pour creer une date relative a un jour de reference. */
  function dateAt(hours: number, minutes = 0): Date {
    const d = new Date('2026-04-06T00:00:00.000Z');
    d.setUTCHours(hours, minutes, 0, 0);
    return d;
  }

  describe('calculateBacCurve()', () => {
    it('devrait retourner BAC 0 sans entrees alcool', () => {
      const entries: SebastianEntry[] = [];
      const now = dateAt(20);
      const result = BacCalculator.calculateBacCurve(
        entries,
        defaultProfile,
        now,
      );

      expect(result.currentBac).toBe(0);
      expect(result.curve).toHaveLength(0);
      expect(result.estimatedSoberAt).toBeNull();
    });

    it('devrait ignorer les entrees cafe', () => {
      const coffeeEntry = buildSebastianEntry({
        category: 'coffee',
        drinkType: 'coffee',
        quantity: 3,
        consumedAt: dateAt(14),
      });
      const now = dateAt(15);
      const result = BacCalculator.calculateBacCurve(
        [coffeeEntry],
        defaultProfile,
        now,
      );

      expect(result.currentBac).toBe(0);
      expect(result.curve).toHaveLength(0);
    });

    it('devrait calculer le BAC pour 1 biere (5%, 25cl) consommee il y a 1h', () => {
      /*
       * Calcul attendu :
       * grammes = 25 × 5 × 0.0789 = 9.8625 g
       * BAC pic = 9.8625 / (0.68 × 70) = 9.8625 / 47.6 ≈ 0.2072 g/L
       * Apres 1h : 0.2072 - 0.15 × 1 = 0.0572 g/L
       */
      const consumedAt = dateAt(14);
      const now = dateAt(15);

      const entry = buildSebastianEntry({
        category: 'alcohol',
        drinkType: 'beer',
        quantity: 1,
        alcoholDegree: 5,
        volumeCl: 25,
        consumedAt,
        date: new Date('2026-04-06'),
      });

      const result = BacCalculator.calculateBacCurve(
        [entry],
        defaultProfile,
        now,
      );

      /* Le BAC doit etre aux alentours de 0.057 g/L. */
      expect(result.currentBac).toBeGreaterThan(0.05);
      expect(result.currentBac).toBeLessThan(0.065);
      expect(result.curve.length).toBeGreaterThan(0);
      expect(result.estimatedSoberAt).not.toBeNull();
    });

    it('devrait calculer un BAC plus eleve pour 2 pintes (5%, 50cl) consommees il y a 2h', () => {
      /*
       * Calcul attendu par pinte :
       * grammes = 50 × 5 × 0.0789 = 19.725 g
       * Total 2 pintes : 39.45 g
       * BAC pic = 39.45 / (0.68 × 70) = 39.45 / 47.6 ≈ 0.8289 g/L
       * Apres 2h : 0.8289 - 0.15 × 2 = 0.5289 g/L
       */
      const consumedAt = dateAt(12);
      const now = dateAt(14);

      const entries = [
        buildSebastianEntry({
          id: 'pint-1',
          category: 'alcohol',
          drinkType: 'beer',
          quantity: 1,
          alcoholDegree: 5,
          volumeCl: 50,
          consumedAt,
          date: new Date('2026-04-06'),
        }),
        buildSebastianEntry({
          id: 'pint-2',
          category: 'alcohol',
          drinkType: 'beer',
          quantity: 1,
          alcoholDegree: 5,
          volumeCl: 50,
          consumedAt,
          date: new Date('2026-04-06'),
        }),
      ];

      const result = BacCalculator.calculateBacCurve(
        entries,
        defaultProfile,
        now,
      );

      /* BAC attendu ~0.229 g/L (chaque pinte contribue 0.414, moins 0.3 metabolise = 0.114 × 2). */
      expect(result.currentBac).toBeGreaterThan(0.2);
      expect(result.currentBac).toBeLessThan(0.26);
    });

    it('devrait estimer le moment de sobriete', () => {
      const consumedAt = dateAt(12);
      const now = dateAt(12, 30);

      const entry = buildSebastianEntry({
        category: 'alcohol',
        drinkType: 'beer',
        quantity: 1,
        alcoholDegree: 5,
        volumeCl: 25,
        consumedAt,
        date: new Date('2026-04-06'),
      });

      const result = BacCalculator.calculateBacCurve(
        [entry],
        defaultProfile,
        now,
      );

      expect(result.estimatedSoberAt).not.toBeNull();
      /* La sobriete devrait arriver apres le moment actuel. */
      expect(result.estimatedSoberAt!.getTime()).toBeGreaterThan(
        consumedAt.getTime(),
      );
    });

    it('devrait utiliser les defauts biere pour les entrees legacy sans drinkType', () => {
      const consumedAt = dateAt(14);
      const now = dateAt(15);

      const legacyEntry = buildSebastianEntry({
        category: 'alcohol',
        drinkType: null,
        quantity: 1,
        alcoholDegree: null,
        volumeCl: null,
        consumedAt,
        date: new Date('2026-04-06'),
      });

      const result = BacCalculator.calculateBacCurve(
        [legacyEntry],
        defaultProfile,
        now,
      );

      /* Meme BAC qu'une biere standard (5%, 25cl) apres 1h. */
      expect(result.currentBac).toBeGreaterThan(0.05);
      expect(result.currentBac).toBeLessThan(0.065);
    });

    it('devrait ignorer les entrees sans consumedAt', () => {
      const entry = buildSebastianEntry({
        category: 'alcohol',
        drinkType: 'beer',
        quantity: 1,
        alcoholDegree: 5,
        volumeCl: 25,
        consumedAt: null,
        date: new Date('2026-04-06'),
      });

      const now = dateAt(15);
      const result = BacCalculator.calculateBacCurve(
        [entry],
        defaultProfile,
        now,
      );

      expect(result.currentBac).toBe(0);
      expect(result.curve).toHaveLength(0);
    });

    it('devrait generer des points de courbe toutes les 15 minutes', () => {
      const consumedAt = dateAt(12);
      const now = dateAt(13);

      const entry = buildSebastianEntry({
        category: 'alcohol',
        drinkType: 'beer',
        quantity: 1,
        alcoholDegree: 5,
        volumeCl: 25,
        consumedAt,
        date: new Date('2026-04-06'),
      });

      const result = BacCalculator.calculateBacCurve(
        [entry],
        defaultProfile,
        now,
      );

      /* Verifier que les points sont espaces de 15 min. */
      for (let i = 1; i < result.curve.length; i++) {
        const diff =
          result.curve[i].time.getTime() - result.curve[i - 1].time.getTime();
        expect(diff).toBe(15 * 60 * 1000);
      }
    });
  });
});
