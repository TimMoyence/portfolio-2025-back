import { RevolutCategoryInferenceStrategy } from './RevolutCategoryInferenceStrategy';
import {
  defaultCategoryRulesConfig,
  type CategoryRulesConfig,
} from './category-rules.config';

describe('RevolutCategoryInferenceStrategy', () => {
  describe('avec la config par defaut anonymisee', () => {
    let strategy: RevolutCategoryInferenceStrategy;

    beforeEach(() => {
      strategy = new RevolutCategoryInferenceStrategy(
        defaultCategoryRulesConfig,
      );
    });

    it('infere Courses pour Carrefour (depense)', () => {
      const result = strategy.infer('Carrefour City', 'CARD_PAYMENT', -42);
      expect(result).toBe('Courses');
    });

    it('infere Salle de sport pour Basic Fit', () => {
      const result = strategy.infer('Basic Fit Paris', 'CARD_PAYMENT', -45);
      expect(result).toBe('Salle de sport');
    });

    it('infere Pockets pour pocket withdrawal positif', () => {
      const result = strategy.infer('Pocket withdrawal', 'TRANSFER', 50);
      expect(result).toBe('Pockets');
    });

    it('ignore la regle pocket-withdrawal-positive si montant negatif (et type non-transfer)', () => {
      const result = strategy.infer('Pocket withdrawal', 'CARD_PAYMENT', -50);
      expect(result).toBe('Autres');
    });

    it('retourne Autres pour une description inconnue', () => {
      const result = strategy.infer('Random merchant XYZ', 'CARD_PAYMENT', -10);
      expect(result).toBe('Autres');
    });

    it('infere Electricite & Internet pour EDF', () => {
      const result = strategy.infer('EDF', 'CARD_PAYMENT', -85);
      expect(result).toBe('Electricité & Internet');
    });
  });

  describe('avec une config custom', () => {
    it('respecte le defaultCategoryName de la config injectee', () => {
      const config: CategoryRulesConfig = {
        rules: [],
        defaultCategoryName: 'Inconnue',
      };
      const strategy = new RevolutCategoryInferenceStrategy(config);

      expect(strategy.infer('whatever', 'TYPE', -1)).toBe('Inconnue');
    });

    it("respecte amountSign='positive' (regle ignoree pour montant negatif)", () => {
      const config: CategoryRulesConfig = {
        rules: [
          {
            keywords: ['salaire'],
            categoryName: 'Revenu',
            amountSign: 'positive',
          },
        ],
        defaultCategoryName: 'Autres',
      };
      const strategy = new RevolutCategoryInferenceStrategy(config);

      expect(strategy.infer('Salaire mensuel', 'TRANSFER', 2000)).toBe(
        'Revenu',
      );
      expect(strategy.infer('Salaire mensuel', 'TRANSFER', -2000)).toBe(
        'Autres',
      );
    });

    it('matche en ignorant la casse et les accents (NFD)', () => {
      const config: CategoryRulesConfig = {
        rules: [{ keywords: ['cafe'], categoryName: 'Cafe' }],
        defaultCategoryName: 'Autres',
      };
      const strategy = new RevolutCategoryInferenceStrategy(config);

      expect(strategy.infer('Café Central', 'CARD_PAYMENT', -3)).toBe('Cafe');
      expect(strategy.infer('CAFE BAR', 'CARD_PAYMENT', -5)).toBe('Cafe');
    });

    it('renvoie transferPocketCategoryName si type=transfer et description=pocket', () => {
      const config: CategoryRulesConfig = {
        rules: [],
        defaultCategoryName: 'Autres',
        transferPocketCategoryName: 'Pockets',
      };
      const strategy = new RevolutCategoryInferenceStrategy(config);

      expect(strategy.infer('pocket move', 'TRANSFER', -10)).toBe('Pockets');
    });
  });
});
