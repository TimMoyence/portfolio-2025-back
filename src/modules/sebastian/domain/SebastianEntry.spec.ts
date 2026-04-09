import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { SebastianEntry } from './SebastianEntry';

describe('SebastianEntry', () => {
  const validProps = {
    userId: 'user-1',
    category: 'coffee',
    quantity: 2,
    date: '2026-03-15',
    notes: 'Espresso double',
  };

  describe('create()', () => {
    it('devrait creer une entree cafe valide avec unite cup', () => {
      const entry = SebastianEntry.create(validProps);

      expect(entry.userId).toBe('user-1');
      expect(entry.category).toBe('coffee');
      expect(entry.quantity).toBe(2);
      expect(entry.unit).toBe('cup');
      expect(entry.date).toEqual(new Date('2026-03-15'));
      expect(entry.notes).toBe('Espresso double');
      expect(entry.createdAt).toBeInstanceOf(Date);
    });

    it('devrait creer une entree alcool valide avec unite standard_drink', () => {
      const entry = SebastianEntry.create({
        ...validProps,
        category: 'alcohol',
        quantity: 1,
      });

      expect(entry.category).toBe('alcohol');
      expect(entry.unit).toBe('standard_drink');
    });

    it('devrait definir notes a null si non fourni', () => {
      const entry = SebastianEntry.create({ ...validProps, notes: undefined });
      expect(entry.notes).toBeNull();
    });

    it("devrait rejeter si l'userId est vide", () => {
      expect(() =>
        SebastianEntry.create({ ...validProps, userId: '  ' }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter une categorie invalide', () => {
      expect(() =>
        SebastianEntry.create({ ...validProps, category: 'soda' }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter une quantite negative', () => {
      expect(() =>
        SebastianEntry.create({ ...validProps, quantity: -1 }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter une quantite de zero', () => {
      expect(() =>
        SebastianEntry.create({ ...validProps, quantity: 0 }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter une date invalide', () => {
      expect(() =>
        SebastianEntry.create({ ...validProps, date: 'not-a-date' }),
      ).toThrow(DomainValidationError);
    });

    it('devrait creer une entree avec drinkType cocktail', () => {
      const entry = SebastianEntry.create({
        ...validProps,
        drinkType: 'cocktail',
      });

      expect(entry.category).toBe('alcohol');
      expect(entry.drinkType).toBe('cocktail');
      expect(entry.alcoholDegree).toBe(15);
      expect(entry.volumeCl).toBe(20);
      expect(entry.unit).toBe('standard_drink');
    });

    it('devrait creer une entree avec drinkType spiritueux', () => {
      const entry = SebastianEntry.create({
        ...validProps,
        drinkType: 'spiritueux',
      });

      expect(entry.category).toBe('alcohol');
      expect(entry.drinkType).toBe('spiritueux');
      expect(entry.alcoholDegree).toBe(40);
      expect(entry.volumeCl).toBe(4);
      expect(entry.unit).toBe('standard_drink');
    });

    it('devrait creer une entree avec drinkType cidre', () => {
      const entry = SebastianEntry.create({
        ...validProps,
        drinkType: 'cidre',
      });

      expect(entry.category).toBe('alcohol');
      expect(entry.drinkType).toBe('cidre');
      expect(entry.alcoholDegree).toBe(5);
      expect(entry.volumeCl).toBe(25);
      expect(entry.unit).toBe('standard_drink');
    });

    it('devrait utiliser consumedAt personnalise si fourni', () => {
      const entry = SebastianEntry.create({
        ...validProps,
        consumedAt: '2026-04-08T22:08:00.000Z',
      });
      expect(entry.consumedAt).toEqual(new Date('2026-04-08T22:08:00.000Z'));
    });

    it('devrait utiliser la date courante si consumedAt non fourni', () => {
      const before = new Date();
      const entry = SebastianEntry.create(validProps);
      const after = new Date();
      expect(entry.consumedAt!.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(entry.consumedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('devrait rejeter un consumedAt invalide', () => {
      expect(() =>
        SebastianEntry.create({ ...validProps, consumedAt: 'not-a-date' }),
      ).toThrow(DomainValidationError);
    });
  });

  describe('fromPersistence()', () => {
    it('devrait reconstruire une entree depuis la persistence', () => {
      const entry = SebastianEntry.fromPersistence({
        id: 'entry-1',
        userId: 'user-1',
        category: 'alcohol',
        quantity: 3,
        unit: 'standard_drink',
        date: new Date('2026-03-15'),
        notes: 'Biere',
        createdAt: new Date('2026-01-01'),
        drinkType: null,
        alcoholDegree: null,
        volumeCl: null,
        consumedAt: null,
      });

      expect(entry.id).toBe('entry-1');
      expect(entry.category).toBe('alcohol');
      expect(entry.unit).toBe('standard_drink');
      expect(entry.quantity).toBe(3);
    });
  });
});
