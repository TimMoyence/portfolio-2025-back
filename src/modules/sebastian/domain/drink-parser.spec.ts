import { parseDrinkMessage } from './drink-parser';

describe('parseDrinkMessage', () => {
  describe('commandes slash — grammaire v2', () => {
    it('/pint → 1 pinte, degre 5 (default), pas de consumedAt', () => {
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
          drinkType: 'beer',
          alcoholDegree: 5,
          volumeCl: 50,
        }),
      );
      expect(result.drinks[0].consumedAt).toBeUndefined();
    });

    it('/pint 8 → 1 pinte, degre 8 (nombre=degre), quantity=2', () => {
      const result = parseDrinkMessage('/pint 8');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].quantity).toBe(2);
      expect(result.drinks[0].displayCount).toBe(1);
      expect(result.drinks[0].alcoholDegree).toBe(8);
    });

    it('/pint qts:2 8 → 2 pintes, degre 8, quantity=4', () => {
      const result = parseDrinkMessage('/pint qts:2 8');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].quantity).toBe(4);
      expect(result.drinks[0].displayCount).toBe(2);
      expect(result.drinks[0].alcoholDegree).toBe(8);
    });

    it('/pint qts:2 → 2 pintes, degre 5 (default), quantity=4', () => {
      const result = parseDrinkMessage('/pint qts:2');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].quantity).toBe(4);
      expect(result.drinks[0].displayCount).toBe(2);
      expect(result.drinks[0].alcoholDegree).toBe(5);
    });

    it('/beer 22h 8 → 1 biere, 22h (consumedAt), 8 degres', () => {
      const result = parseDrinkMessage('/beer 22h 8');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].alcoholDegree).toBe(8);
      expect(result.drinks[0].consumedAt).toBeDefined();
      const date = new Date(result.drinks[0].consumedAt!);
      expect(date.getHours()).toBe(22);
      expect(date.getMinutes()).toBe(0);
    });

    it('/beer 22:08 → 1 biere, 22h08, degre 5 (default)', () => {
      const result = parseDrinkMessage('/beer 22:08');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].alcoholDegree).toBe(5);
      expect(result.drinks[0].consumedAt).toBeDefined();
      const date = new Date(result.drinks[0].consumedAt!);
      expect(date.getHours()).toBe(22);
      expect(date.getMinutes()).toBe(8);
    });

    it('/beer 22h00 → 1 biere, 22h00', () => {
      const result = parseDrinkMessage('/beer 22h00');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].consumedAt).toBeDefined();
      const date = new Date(result.drinks[0].consumedAt!);
      expect(date.getHours()).toBe(22);
      expect(date.getMinutes()).toBe(0);
    });

    it('/pinte hier 22:08 → hier a 22h08', () => {
      const result = parseDrinkMessage('/pinte hier 22:08');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].consumedAt).toBeDefined();
      const date = new Date(result.drinks[0].consumedAt!);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(date.getDate()).toBe(yesterday.getDate());
      expect(date.getMonth()).toBe(yesterday.getMonth());
      expect(date.getHours()).toBe(22);
      expect(date.getMinutes()).toBe(8);
    });

    it('/pinte hier soir → hier a 21h', () => {
      const result = parseDrinkMessage('/pinte hier soir');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].consumedAt).toBeDefined();
      const date = new Date(result.drinks[0].consumedAt!);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(date.getDate()).toBe(yesterday.getDate());
      expect(date.getMonth()).toBe(yesterday.getMonth());
      expect(date.getHours()).toBe(21);
      expect(date.getMinutes()).toBe(0);
    });

    it('/pinte mardi 22h 8 → dernier mardi a 22h, 8 degres', () => {
      const result = parseDrinkMessage('/pinte mardi 22h 8');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].alcoholDegree).toBe(8);
      expect(result.drinks[0].consumedAt).toBeDefined();
      const date = new Date(result.drinks[0].consumedAt!);
      // mardi = 2 (Tuesday)
      expect(date.getDay()).toBe(2);
      expect(date.getHours()).toBe(22);
      // La date doit etre dans le passe ou aujourd'hui
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('/beer yesterday 22:00 → hier a 22h', () => {
      const result = parseDrinkMessage('/beer yesterday 22:00');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].consumedAt).toBeDefined();
      const date = new Date(result.drinks[0].consumedAt!);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(date.getDate()).toBe(yesterday.getDate());
      expect(date.getHours()).toBe(22);
      expect(date.getMinutes()).toBe(0);
    });

    it('/cocktail 15 → 1 cocktail, 15 degres', () => {
      const result = parseDrinkMessage('/cocktail 15');
      expect(result.confident).toBe(true);
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          category: 'alcohol',
          quantity: 1,
          unit: 'standard_drink',
          source: 'cocktail',
          displayCount: 1,
          drinkType: 'cocktail',
          alcoholDegree: 15,
        }),
      );
    });

    it('/spiritueux → 1 spiritueux, default 40 degres', () => {
      const result = parseDrinkMessage('/spiritueux');
      expect(result.confident).toBe(true);
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          category: 'alcohol',
          quantity: 1,
          unit: 'standard_drink',
          source: 'spiritueux',
          displayCount: 1,
          drinkType: 'spiritueux',
          alcoholDegree: 40,
          volumeCl: 4,
        }),
      );
    });

    it('/cidre 6 → 1 cidre, 6 degres', () => {
      const result = parseDrinkMessage('/cidre 6');
      expect(result.confident).toBe(true);
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          category: 'alcohol',
          quantity: 1,
          unit: 'standard_drink',
          source: 'cidre',
          displayCount: 1,
          drinkType: 'cidre',
          alcoholDegree: 6,
        }),
      );
    });

    it('/coffee → 1 cafe, pas de degre', () => {
      const result = parseDrinkMessage('/coffee');
      expect(result.confident).toBe(true);
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          category: 'coffee',
          quantity: 1,
          unit: 'cup',
          source: 'coffee',
          displayCount: 1,
          drinkType: 'coffee',
          alcoholDegree: null,
        }),
      );
    });

    it('/coffee qts:3 → 3 cafes', () => {
      const result = parseDrinkMessage('/coffee qts:3');
      expect(result.confident).toBe(true);
      expect(result.drinks[0].quantity).toBe(3);
      expect(result.drinks[0].displayCount).toBe(3);
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

    it('commandes multiples /pint /coffee → 2 entries', () => {
      const result = parseDrinkMessage('/pint /coffee');
      expect(result.confident).toBe(true);
      expect(result.drinks).toHaveLength(2);
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({ source: 'pint', quantity: 2 }),
      );
      expect(result.drinks[1]).toEqual(
        expect.objectContaining({ source: 'coffee', quantity: 1 }),
      );
    });

    it("heure seule sans jour → consumedAt aujourd'hui a cette heure", () => {
      const result = parseDrinkMessage('/beer 14h');
      expect(result.drinks[0].consumedAt).toBeDefined();
      const date = new Date(result.drinks[0].consumedAt!);
      const today = new Date();
      expect(date.getDate()).toBe(today.getDate());
      expect(date.getHours()).toBe(14);
    });

    it('jour seul sans heure → consumedAt ce jour a minuit', () => {
      const result = parseDrinkMessage('/beer hier');
      expect(result.drinks[0].consumedAt).toBeDefined();
      const date = new Date(result.drinks[0].consumedAt!);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(date.getDate()).toBe(yesterday.getDate());
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
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

    it('"4 bi\u00e8res" → 4 standard_drinks (accent)', () => {
      const result = parseDrinkMessage('4 bi\u00e8res');
      expect(result.drinks[0].quantity).toBe(4);
    });

    it('"4 pintes" → 8 standard_drinks', () => {
      const result = parseDrinkMessage('4 pintes');
      expect(result.drinks[0].quantity).toBe(8);
    });

    it('"trois caf\u00e9s" → 3 cups (accent)', () => {
      const result = parseDrinkMessage('trois caf\u00e9s');
      expect(result.drinks[0].quantity).toBe(3);
    });

    it('"deux bi\u00e8res" → 2', () => {
      const result = parseDrinkMessage('deux bi\u00e8res');
      expect(result.drinks[0].quantity).toBe(2);
    });

    it('"une pinte" → 2 standard_drinks', () => {
      const result = parseDrinkMessage('une pinte');
      expect(result.drinks[0].quantity).toBe(2);
    });

    it('"un cocktail" → 1 cocktail', () => {
      const result = parseDrinkMessage('un cocktail');
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          category: 'alcohol',
          quantity: 1,
          source: 'cocktail',
          drinkType: 'cocktail',
        }),
      );
    });

    it('"2 cidres" → 2 cidre', () => {
      const result = parseDrinkMessage('2 cidres');
      expect(result.drinks[0]).toEqual(
        expect.objectContaining({
          quantity: 2,
          source: 'cidre',
          drinkType: 'cidre',
        }),
      );
    });
  });

  describe('messages mixtes', () => {
    it('"2 pints et 3 caf\u00e9s" → 2 entries', () => {
      const result = parseDrinkMessage('2 pints et 3 caf\u00e9s');
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
      const result = parseDrinkMessage('/pint 8');
      expect(result.rawInput).toBe('/pint 8');
    });
  });
});
