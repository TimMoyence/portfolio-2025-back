import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { SebastianGoal } from './SebastianGoal';

describe('SebastianGoal', () => {
  const validProps = {
    userId: 'user-1',
    category: 'coffee',
    targetQuantity: 3,
    period: 'daily',
  };

  describe('create()', () => {
    it('devrait creer un objectif valide', () => {
      const goal = SebastianGoal.create(validProps);

      expect(goal.userId).toBe('user-1');
      expect(goal.category).toBe('coffee');
      expect(goal.targetQuantity).toBe(3);
      expect(goal.period).toBe('daily');
      expect(goal.isActive).toBe(true);
      expect(goal.createdAt).toBeInstanceOf(Date);
    });

    it('devrait accepter la periode weekly', () => {
      const goal = SebastianGoal.create({ ...validProps, period: 'weekly' });
      expect(goal.period).toBe('weekly');
    });

    it('devrait accepter la periode monthly', () => {
      const goal = SebastianGoal.create({ ...validProps, period: 'monthly' });
      expect(goal.period).toBe('monthly');
    });

    it("devrait rejeter si l'userId est vide", () => {
      expect(() => SebastianGoal.create({ ...validProps, userId: '' })).toThrow(
        DomainValidationError,
      );
    });

    it('devrait rejeter une categorie invalide', () => {
      expect(() =>
        SebastianGoal.create({ ...validProps, category: 'tea' }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter une quantite cible negative', () => {
      expect(() =>
        SebastianGoal.create({ ...validProps, targetQuantity: -1 }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter une quantite cible de zero', () => {
      expect(() =>
        SebastianGoal.create({ ...validProps, targetQuantity: 0 }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter une periode invalide', () => {
      expect(() =>
        SebastianGoal.create({ ...validProps, period: 'yearly' }),
      ).toThrow(DomainValidationError);
    });
  });

  describe('fromPersistence()', () => {
    it('devrait reconstruire un objectif depuis la persistence', () => {
      const goal = SebastianGoal.fromPersistence({
        id: 'goal-1',
        userId: 'user-1',
        category: 'alcohol',
        targetQuantity: 5,
        period: 'weekly',
        isActive: false,
        createdAt: new Date('2026-01-01'),
      });

      expect(goal.id).toBe('goal-1');
      expect(goal.category).toBe('alcohol');
      expect(goal.targetQuantity).toBe(5);
      expect(goal.period).toBe('weekly');
      expect(goal.isActive).toBe(false);
    });
  });
});
