import {
  buildDrinkTypeKeyboard,
  buildQuantityKeyboard,
  parseCallbackData,
} from './DrinkKeyboard';

describe('DrinkKeyboard', () => {
  describe('buildDrinkTypeKeyboard', () => {
    it('cree un clavier avec 8 boutons repartis sur 4 lignes', () => {
      const kb = buildDrinkTypeKeyboard();
      expect(kb.inline_keyboard).toBeDefined();
      expect(kb.inline_keyboard).toHaveLength(4);
      expect(kb.inline_keyboard[0]).toHaveLength(2); // Biere, Vin
      expect(kb.inline_keyboard[1]).toHaveLength(2); // Champagne, Pinte
      expect(kb.inline_keyboard[2]).toHaveLength(2); // Cocktail, Spiritueux
      expect(kb.inline_keyboard[3]).toHaveLength(2); // Cidre, Cafe
    });
  });

  describe('buildQuantityKeyboard', () => {
    it('cree un clavier avec 5 boutons de quantite', () => {
      const kb = buildQuantityKeyboard('beer');
      expect(kb.inline_keyboard[0]).toHaveLength(5);
      const firstBtn = kb.inline_keyboard[0][0] as { callback_data: string };
      const lastBtn = kb.inline_keyboard[0][4] as { callback_data: string };
      expect(firstBtn.callback_data).toBe('confirm:beer:1');
      expect(lastBtn.callback_data).toBe('confirm:beer:5');
    });
  });

  describe('parseCallbackData', () => {
    it('parse select_type:beer', () => {
      const result = parseCallbackData('select_type:beer');
      expect(result).toEqual({ action: 'select_type', drinkType: 'beer' });
    });

    it('parse confirm:pint:3', () => {
      const result = parseCallbackData('confirm:pint:3');
      expect(result).toEqual({
        action: 'confirm',
        drinkType: 'pint',
        quantity: 3,
      });
    });

    it('retourne null pour des donnees invalides', () => {
      expect(parseCallbackData('invalid')).toBeNull();
    });
  });
});
