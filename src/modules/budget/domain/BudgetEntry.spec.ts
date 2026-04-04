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

  it('devrait refuser un state invalide', () => {
    expect(() =>
      BudgetEntry.create({
        groupId: 'group-1',
        createdByUserId: 'user-1',
        date: '2026-03-15',
        description: 'Test',
        amount: -10,
        type: 'VARIABLE',
        state: 'INVALID',
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait accepter le state PENDING', () => {
    const entry = BudgetEntry.create({
      groupId: 'group-1',
      createdByUserId: 'user-1',
      date: '2026-03-15',
      description: 'Test',
      amount: -10,
      type: 'VARIABLE',
      state: 'PENDING',
    });

    expect(entry.state).toBe('PENDING');
  });

  it('devrait defaulter le state a COMPLETED', () => {
    const entry = BudgetEntry.create({
      groupId: 'group-1',
      createdByUserId: 'user-1',
      date: '2026-03-15',
      description: 'Test',
      amount: -10,
      type: 'VARIABLE',
    });

    expect(entry.state).toBe('COMPLETED');
  });

  it('devrait refuser un groupId vide', () => {
    expect(() =>
      BudgetEntry.create({
        groupId: '  ',
        createdByUserId: 'user-1',
        date: '2026-03-15',
        description: 'Test',
        amount: -10,
        type: 'VARIABLE',
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un createdByUserId vide', () => {
    expect(() =>
      BudgetEntry.create({
        groupId: 'group-1',
        createdByUserId: '  ',
        date: '2026-03-15',
        description: 'Test',
        amount: -10,
        type: 'VARIABLE',
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un type invalide', () => {
    expect(() =>
      BudgetEntry.create({
        groupId: 'group-1',
        createdByUserId: 'user-1',
        date: '2026-03-15',
        description: 'Test',
        amount: -10,
        type: 'INVALID',
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un amount non-number', () => {
    expect(() =>
      BudgetEntry.create({
        groupId: 'group-1',
        createdByUserId: 'user-1',
        date: '2026-03-15',
        description: 'Test',
        amount: 'abc' as unknown as number,
        type: 'VARIABLE',
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait accepter categoryId null par defaut', () => {
    const entry = BudgetEntry.create({
      groupId: 'group-1',
      createdByUserId: 'user-1',
      date: '2026-03-15',
      description: 'Test',
      amount: -10,
      type: 'FIXED',
    });

    expect(entry.categoryId).toBeNull();
  });

  it('devrait accepter un montant positif', () => {
    const entry = BudgetEntry.create({
      groupId: 'group-1',
      createdByUserId: 'user-1',
      date: '2026-03-15',
      description: 'Salaire',
      amount: 2500,
      type: 'FIXED',
    });

    expect(entry.amount).toBe(2500);
  });
});
