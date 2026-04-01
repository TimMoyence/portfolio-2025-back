import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { BudgetCategory } from './BudgetCategory';

describe('BudgetCategory', () => {
  it('devrait creer une categorie valide', () => {
    const cat = BudgetCategory.create({
      name: 'Courses',
      groupId: null,
      color: '#22C55E',
      icon: 'shopping-cart',
      budgetType: 'VARIABLE',
      budgetLimit: 600,
    });

    expect(cat.name).toBe('Courses');
    expect(cat.budgetType).toBe('VARIABLE');
    expect(cat.budgetLimit).toBe(600);
  });

  it('devrait refuser un nom vide', () => {
    expect(() =>
      BudgetCategory.create({
        name: '',
        groupId: null,
        budgetType: 'VARIABLE',
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un type invalide', () => {
    expect(() =>
      BudgetCategory.create({
        name: 'Test',
        groupId: null,
        budgetType: 'INVALID' as 'FIXED',
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un budget_limit negatif', () => {
    expect(() =>
      BudgetCategory.create({
        name: 'Test',
        groupId: null,
        budgetType: 'FIXED',
        budgetLimit: -10,
      }),
    ).toThrow(DomainValidationError);
  });
});
