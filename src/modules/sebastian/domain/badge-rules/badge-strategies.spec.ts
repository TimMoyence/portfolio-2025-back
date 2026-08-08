import {
  BADGE_STRATEGIES,
  FULL_HISTORY,
  fullHistoryBadgeKeys,
  maxBadgeWindowDays,
  type BadgeStrategy,
  type BadgeWindow,
} from './badge-strategies';

const byLocale = (a: string, b: string): number => a.localeCompare(b);

describe('badge-strategies — fenetres declarees', () => {
  describe('evaluationWindow par strategie', () => {
    const expectedWindows: Array<[string, BadgeWindow]> = [
      ['first-log', FULL_HISTORY],
      ['zen-monk-7', 7],
      ['zen-monk-30', 30],
      ['espresso-machine', FULL_HISTORY],
      ['dry-week', 7],
      ['goal-crusher', 30],
      ['early-bird', FULL_HISTORY],
      ['night-owl', FULL_HISTORY],
      ['perfect-month', 30],
      ['comeback-kid', 14],
    ];

    it.each(expectedWindows)(
      '%s devrait declarer une fenetre de %s jours',
      (key, evaluationWindow) => {
        expect(BADGE_STRATEGIES.get(key)?.evaluationWindow).toBe(
          evaluationWindow,
        );
      },
    );

    it('devrait couvrir toutes les strategies du registry', () => {
      expect(expectedWindows.map(([key]) => key).sort(byLocale)).toEqual(
        Array.from(BADGE_STRATEGIES.keys()).sort(byLocale),
      );
    });
  });

  describe('maxBadgeWindowDays', () => {
    it('devrait retourner la plus longue fenetre du registry actuel', () => {
      expect(maxBadgeWindowDays(BADGE_STRATEGIES)).toBe(30);
    });

    it('devrait suivre une strategie declarant une fenetre plus longue', () => {
      const longWindow: BadgeStrategy = {
        key: 'long-window',
        evaluationWindow: 90,
        evaluate: () => false,
      };
      const extended = new Map([
        ...BADGE_STRATEGIES,
        [longWindow.key, longWindow],
      ]);

      expect(maxBadgeWindowDays(extended)).toBe(90);
    });

    it('devrait retourner 0 quand aucune strategie ne declare de fenetre', () => {
      expect(maxBadgeWindowDays(new Map())).toBe(0);
    });

    it('devrait reduire la fenetre quand la strategie la plus longue est retiree', () => {
      const max = maxBadgeWindowDays(BADGE_STRATEGIES);
      const sansLesPlusLongues = new Map(
        Array.from(BADGE_STRATEGIES).filter(
          ([, strategy]) => strategy.evaluationWindow !== max,
        ),
      );

      expect(maxBadgeWindowDays(sansLesPlusLongues)).toBeLessThan(max);
    });

    it('devrait couvrir la fenetre de chaque strategie du registry', () => {
      const max = maxBadgeWindowDays(BADGE_STRATEGIES);

      for (const strategy of BADGE_STRATEGIES.values()) {
        if (strategy.evaluationWindow !== FULL_HISTORY) {
          expect(strategy.evaluationWindow).toBeLessThanOrEqual(max);
        }
      }
    });
  });

  describe('fullHistoryBadgeKeys', () => {
    it('devrait lister les badges evalues sur tout l historique', () => {
      expect(fullHistoryBadgeKeys(BADGE_STRATEGIES).sort(byLocale)).toEqual([
        'early-bird',
        'espresso-machine',
        'first-log',
        'night-owl',
      ]);
    });

    it('devrait partitionner le registry avec les strategies fenetrees', () => {
      const fullHistory = fullHistoryBadgeKeys(BADGE_STRATEGIES);
      const windowed = Array.from(BADGE_STRATEGIES.values())
        .filter((s) => s.evaluationWindow !== FULL_HISTORY)
        .map((s) => s.key);

      expect([...fullHistory, ...windowed].sort(byLocale)).toEqual(
        Array.from(BADGE_STRATEGIES.keys()).sort(byLocale),
      );
    });

    it('devrait exclure toute strategie declarant une fenetre', () => {
      const windowed: BadgeStrategy = {
        key: 'windowed',
        evaluationWindow: 3,
        evaluate: () => false,
      };
      const extended = new Map([...BADGE_STRATEGIES, [windowed.key, windowed]]);

      expect(fullHistoryBadgeKeys(extended)).not.toContain('windowed');
    });
  });
});
