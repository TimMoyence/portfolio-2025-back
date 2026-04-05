import { parseDrinkMessage } from './drink-parser';

describe('parseDrinkMessage', () => {
  describe('commandes slash', () => {
    it('/pint → 1 pinte = 2 standard_drinks', () => {
      const result = parseDrinkMessage('/pint');
      expect(result.confident).toBe(true);
      expect(result.drinks).toHaveLength(1);
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          category: 'alcohol',
          quantity: 2,
          unit: 'standard_drink',
          source: 'pint',
          displayCount: 1,
        }),
      );
    });

    it('/pint 4 → 4 pintes = 8 standard_drinks', () => {
      const result = parseDrinkMessage('/pint 4');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].quantity).toBe(8);
      expect(result.drinks[0].displayCount).toBe(4);
    });

    it('/beer → 1 biere = 1 standard_drink', () => {
      const result = parseDrinkMessage('/beer');
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          category: 'alcohol',
          quantity: 1,
          unit: 'standard_drink',
          source: 'beer',
        }),
      );
    });

    it('/beer 3 → 3 bieres = 3 standard_drinks', () => {
      const result = parseDrinkMessage('/beer 3');
      expect(result.drinks[0].quantity).toBe(3);
    });

    it('/coffee → 1 cafe = 1 cup', () => {
      const result = parseDrinkMessage('/coffee');
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          category: 'coffee',
          quantity: 1,
          unit: 'cup',
          source: 'coffee',
        }),
      );
    });

    it('/coffee 2 → 2 cafes = 2 cups', () => {
      const result = parseDrinkMessage('/coffee 2');
      expect(result.drinks[0].quantity).toBe(2);
    });

    it('/pint 4 /coffee 2 → combine 2 entries', () => {
      const result = parseDrinkMessage('/pint 4 /coffee 2');
      expect(result.confident).toBe(true);
      expect(result.drinks).toHaveLength(2);
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({ source: 'pint', quantity: 8 }),
      );
      expect(result.drinks[1]).toEqual(
        expect.objectContaining({ source: 'coffee', quantity: 2 }),
      );
    });

    it('/beer 2 /pint 1 /coffee 3 → 3 entries', () => {
      const result = parseDrinkMessage('/beer 2 /pint 1 /coffee 3');
      expect(result.drinks).toHaveLength(3);
      expect(result.confident).toBe(true);
    });
  });

  describe('langage naturel — anglais', () => {
    it('"2 pints" → 4 standard_drinks', () => {
      const result = parseDrinkMessage('2 pints');
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          category: 'alcohol',
          quantity: 4,
          source: 'pint',
        }),
      );
    });

    it('"four beer" → 4 standard_drinks', () => {
      const result = parseDrinkMessage('four beer');
      expect(result.drinks[0].quantity).toBe(4);
      expect(result.confident).toBe(true);
    });

    it('"3 coffees" → 3 cups', () => {
      const result = parseDrinkMessage('3 coffees');
      expect(result.drinks[0].quantity).toBe(3);
    });

    it('"one beer" → 1 standard_drink', () => {
      const result = parseDrinkMessage('one beer');
      expect(result.drinks[0].quantity).toBe(1);
    });
  });

  describe('langage naturel — francais', () => {
    it('"4 bieres" → 4 standard_drinks', () => {
      const result = parseDrinkMessage('4 bieres');
      expect(result.drinks[0].quantity).toBe(4);
      expect(result.confident).toBe(true);
    });

    it('"4 bières" → 4 standard_drinks', () => {
      const result = parseDrinkMessage('4 bières');
      expect(result.drinks[0].quantity).toBe(4);
    });

    it('"4 pintes" → 8 standard_drinks', () => {
      const result = parseDrinkMessage('4 pintes');
      expect(result.drinks[0].quantity).toBe(8);
    });

    it('"trois cafés" → 3 cups', () => {
      const result = parseDrinkMessage('trois cafés');
      expect(result.drinks[0].quantity).toBe(3);
    });

    it('"deux bières" → 2 standard_drinks', () => {
      const result = parseDrinkMessage('deux bières');
      expect(result.drinks[0].quantity).toBe(2);
    });

    it('"une pinte" → 2 standard_drinks', () => {
      const result = parseDrinkMessage('une pinte');
      expect(result.drinks[0].quantity).toBe(2);
    });
  });

  describe('messages mixtes', () => {
    it('"2 pints et 3 cafés" → 2 entries', () => {
      const result = parseDrinkMessage('2 pints et 3 cafés');
      expect(result.drinks).toHaveLength(2);
    });
  });

  describe('messages non reconnus', () => {
    it('texte vide → not confident, 0 drinks', () => {
      const result = parseDrinkMessage('');
      expect(result.drinks).toHaveLength(0);
      expect(result.confident).toBe(false);
    });

    it('"hello world" → not confident', () => {
      const result = parseDrinkMessage('hello world');
      expect(result.drinks).toHaveLength(0);
      expect(result.confident).toBe(false);
    });

    it('"bonjour" → not confident', () => {
      const result = parseDrinkMessage('bonjour');
      expect(result.confident).toBe(false);
    });
  });

  describe('rawInput preserve', () => {
    it('conserve le message original', () => {
      const result = parseDrinkMessage('/pint 4');
      expect(result.rawInput).toBe('/pint 4');
    });
  });
});
