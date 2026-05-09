import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';
import { BudgetGoal, withProgress } from './BudgetGoal';

const baseProps = () => ({
  groupId: 'group-1',
  createdByUserId: 'user-1',
  name: 'Epargne vacances',
  kind: 'SAVINGS' as const,
  targetAmount: 1000,
  categoryId: null,
  deadline: null,
});

describe('BudgetGoal', () => {
  describe('create', () => {
    it('devrait creer un goal SAVINGS valide avec isActive=true par defaut', () => {
      const goal = BudgetGoal.create(baseProps());

      expect(goal.groupId).toBe('group-1');
      expect(goal.createdByUserId).toBe('user-1');
      expect(goal.name).toBe('Epargne vacances');
      expect(goal.kind).toBe('SAVINGS');
      expect(goal.targetAmount).toBe(1000);
      expect(goal.categoryId).toBeNull();
      expect(goal.deadline).toBeNull();
      expect(goal.isActive).toBe(true);
      expect(goal.createdAt).toBeInstanceOf(Date);
      expect(goal.updatedAt).toBeInstanceOf(Date);
    });

    it('devrait creer un goal SPENDING_LIMIT valide', () => {
      const goal = BudgetGoal.create({
        ...baseProps(),
        kind: 'SPENDING_LIMIT',
        name: 'Limite courses',
        targetAmount: 400,
      });

      expect(goal.kind).toBe('SPENDING_LIMIT');
      expect(goal.targetAmount).toBe(400);
      expect(goal.categoryId).toBeNull();
    });

    it('devrait creer un goal CATEGORY_LIMIT valide avec categoryId', () => {
      const goal = BudgetGoal.create({
        ...baseProps(),
        kind: 'CATEGORY_LIMIT',
        name: 'Limite restaurants',
        targetAmount: 200,
        categoryId: 'cat-1',
      });

      expect(goal.kind).toBe('CATEGORY_LIMIT');
      expect(goal.categoryId).toBe('cat-1');
    });

    it('devrait conserver la deadline fournie', () => {
      const deadline = new Date('2026-12-31T00:00:00.000Z');
      const goal = BudgetGoal.create({
        ...baseProps(),
        deadline,
      });

      expect(goal.deadline).toEqual(deadline);
    });

    it('devrait honorer isActive=false explicitement passe', () => {
      const goal = BudgetGoal.create({
        ...baseProps(),
        isActive: false,
      });

      expect(goal.isActive).toBe(false);
    });

    it('devrait refuser un targetAmount negatif', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          targetAmount: -1,
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait accepter un targetAmount egal a zero', () => {
      const goal = BudgetGoal.create({
        ...baseProps(),
        targetAmount: 0,
      });

      expect(goal.targetAmount).toBe(0);
    });

    it('devrait refuser un targetAmount non-number', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          targetAmount: 'abc' as unknown as number,
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait refuser un targetAmount NaN', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          targetAmount: Number.NaN,
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait refuser un targetAmount Infinity', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          targetAmount: Number.POSITIVE_INFINITY,
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait refuser un name vide', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          name: '',
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait refuser un name compose uniquement de whitespace', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          name: '   ',
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait refuser un name de plus de 120 caracteres', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          name: 'a'.repeat(121),
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait accepter un name de 120 caracteres exactement', () => {
      const goal = BudgetGoal.create({
        ...baseProps(),
        name: 'a'.repeat(120),
      });

      expect(goal.name.length).toBe(120);
    });

    it('devrait refuser un kind invalide', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          kind: 'INVALID' as unknown as 'SAVINGS',
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait refuser un groupId vide', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          groupId: '   ',
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait refuser un createdByUserId vide', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          createdByUserId: '   ',
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait refuser un goal CATEGORY_LIMIT sans categoryId via InvalidInputError', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          kind: 'CATEGORY_LIMIT',
          categoryId: null,
        }),
      ).toThrow(InvalidInputError);
    });

    it('devrait accepter SAVINGS avec categoryId null', () => {
      const goal = BudgetGoal.create({
        ...baseProps(),
        kind: 'SAVINGS',
        categoryId: null,
      });

      expect(goal.categoryId).toBeNull();
    });

    it('devrait accepter SPENDING_LIMIT avec categoryId null', () => {
      const goal = BudgetGoal.create({
        ...baseProps(),
        kind: 'SPENDING_LIMIT',
        categoryId: null,
      });

      expect(goal.categoryId).toBeNull();
    });

    it('devrait refuser une deadline non-Date', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          deadline: 'not-a-date' as unknown as Date,
        }),
      ).toThrow(DomainValidationError);
    });

    it('devrait refuser une deadline Date invalide', () => {
      expect(() =>
        BudgetGoal.create({
          ...baseProps(),
          deadline: new Date('not-a-date'),
        }),
      ).toThrow(DomainValidationError);
    });
  });

  describe('withProgress', () => {
    const goal = BudgetGoal.create({
      ...baseProps(),
      targetAmount: 1000,
    });

    it('devrait calculer 50% pour 500 / 1000', () => {
      const enriched = withProgress(goal, 500);

      expect(enriched.currentAmount).toBe(500);
      expect(enriched.progressPercent).toBe(50);
    });

    it('devrait clamper progressPercent a 100 quand currentAmount > targetAmount', () => {
      const enriched = withProgress(goal, 1500);

      expect(enriched.currentAmount).toBe(1500);
      expect(enriched.progressPercent).toBe(100);
    });

    it('devrait clamper progressPercent a 0 quand currentAmount est negatif', () => {
      const enriched = withProgress(goal, -50);

      expect(enriched.progressPercent).toBe(0);
    });

    it('devrait retourner progressPercent=0 quand targetAmount=0 (pas de division par zero)', () => {
      const zeroGoal = BudgetGoal.create({
        ...baseProps(),
        targetAmount: 0,
      });
      const enriched = withProgress(zeroGoal, 100);

      expect(enriched.progressPercent).toBe(0);
    });

    it('devrait propager toutes les proprietes du goal d origine', () => {
      const enriched = withProgress(goal, 250);

      expect(enriched.id).toBe(goal.id);
      expect(enriched.groupId).toBe(goal.groupId);
      expect(enriched.createdByUserId).toBe(goal.createdByUserId);
      expect(enriched.name).toBe(goal.name);
      expect(enriched.kind).toBe(goal.kind);
      expect(enriched.targetAmount).toBe(goal.targetAmount);
      expect(enriched.categoryId).toBe(goal.categoryId);
      expect(enriched.deadline).toBe(goal.deadline);
      expect(enriched.isActive).toBe(goal.isActive);
      expect(enriched.createdAt).toBe(goal.createdAt);
      expect(enriched.updatedAt).toBe(goal.updatedAt);
      expect(enriched.currentAmount).toBe(250);
      expect(enriched.progressPercent).toBe(25);
    });
  });
});
