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

  it('devrait defaulter le budgetLimit a 0', () => {
    const cat = BudgetCategory.create({
      name: 'Test',
      groupId: null,
      budgetType: 'FIXED',
    });
    expect(cat.budgetLimit).toBe(0);
  });

  it('devrait defaulter la couleur et l icone', () => {
    const cat = BudgetCategory.create({
      name: 'Test',
      groupId: null,
      budgetType: 'VARIABLE',
    });
    expect(cat.color).toBe('#6B7280');
    expect(cat.icon).toBe('tag');
  });

  it('devrait defaulter le displayOrder a 0', () => {
    const cat = BudgetCategory.create({
      name: 'Test',
      groupId: null,
      budgetType: 'FIXED',
    });
    expect(cat.displayOrder).toBe(0);
  });

  it('devrait accepter FIXED comme type', () => {
    const cat = BudgetCategory.create({
      name: 'Loyer',
      groupId: 'group-1',
      budgetType: 'FIXED',
      budgetLimit: 1200,
      displayOrder: 1,
    });
    expect(cat.budgetType).toBe('FIXED');
    expect(cat.groupId).toBe('group-1');
  });

  it('devrait avoir une date de creation', () => {
    const cat = BudgetCategory.create({
      name: 'Test',
      groupId: null,
      budgetType: 'VARIABLE',
    });
    expect(cat.createdAt).toBeInstanceOf(Date);
  });
});
