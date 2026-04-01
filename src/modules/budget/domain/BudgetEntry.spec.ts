import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { BudgetEntry } from './BudgetEntry';

describe('BudgetEntry', () => {
  it('devrait creer une entree valide', () => {
    const entry = BudgetEntry.create({
      groupId: 'group-1',
      createdByUserId: 'user-1',
      categoryId: 'cat-1',
      date: '2026-03-15',
      description: 'Carrefour courses',
      amount: -85.5,
      type: 'VARIABLE',
    });

    expect(entry.description).toBe('Carrefour courses');
    expect(entry.amount).toBe(-85.5);
    expect(entry.type).toBe('VARIABLE');
  });

  it('devrait refuser une description vide', () => {
    expect(() =>
      BudgetEntry.create({
        groupId: 'group-1',
        createdByUserId: 'user-1',
        date: '2026-03-15',
        description: '',
        amount: -10,
        type: 'VARIABLE',
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un montant a zero', () => {
    expect(() =>
      BudgetEntry.create({
        groupId: 'group-1',
        createdByUserId: 'user-1',
        date: '2026-03-15',
        description: 'Test',
        amount: 0,
        type: 'VARIABLE',
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser une date invalide', () => {
    expect(() =>
      BudgetEntry.create({
        groupId: 'group-1',
        createdByUserId: 'user-1',
        date: 'not-a-date',
        description: 'Test',
        amount: -10,
        type: 'VARIABLE',
      }),
    ).toThrow(DomainValidationError);
  });
});
