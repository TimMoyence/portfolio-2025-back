import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { RecurringEntry } from './RecurringEntry';

describe('RecurringEntry', () => {
  const validMonthlyProps = {
    groupId: 'group-1',
    createdByUserId: 'user-1',
    categoryId: 'cat-1',
    description: 'Loyer mensuel',
    amount: -1200,
    type: 'FIXED',
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    dayOfWeek: null,
    startDate: new Date('2026-01-01'),
    endDate: null,
  } as const;

  const validWeeklyProps = {
    groupId: 'group-1',
    createdByUserId: 'user-1',
    categoryId: null,
    description: 'Courses hebdomadaires',
    amount: -80,
    type: 'VARIABLE',
    frequency: 'WEEKLY',
    dayOfMonth: null,
    dayOfWeek: 6,
    startDate: new Date('2026-01-01'),
    endDate: null,
  } as const;

  it('devrait creer une entree recurrente MONTHLY valide', () => {
    const entry = RecurringEntry.create(validMonthlyProps);

    expect(entry.description).toBe('Loyer mensuel');
    expect(entry.amount).toBe(-1200);
    expect(entry.type).toBe('FIXED');
    expect(entry.frequency).toBe('MONTHLY');
    expect(entry.dayOfMonth).toBe(1);
    expect(entry.dayOfWeek).toBeNull();
    expect(entry.isActive).toBe(true);
  });

  it('devrait creer une entree recurrente WEEKLY valide', () => {
    const entry = RecurringEntry.create(validWeeklyProps);

    expect(entry.frequency).toBe('WEEKLY');
    expect(entry.dayOfWeek).toBe(6);
    expect(entry.dayOfMonth).toBeNull();
  });

  it('devrait creer une entree recurrente BIWEEKLY valide', () => {
    const entry = RecurringEntry.create({
      ...validWeeklyProps,
      frequency: 'BIWEEKLY',
      dayOfWeek: 1,
    });

    expect(entry.frequency).toBe('BIWEEKLY');
    expect(entry.dayOfWeek).toBe(1);
  });

  it('devrait accepter une endDate valide', () => {
    const entry = RecurringEntry.create({
      ...validMonthlyProps,
      endDate: new Date('2026-12-31'),
    });

    expect(entry.endDate).toEqual(new Date('2026-12-31'));
  });

  it('devrait refuser une description vide', () => {
    expect(() =>
      RecurringEntry.create({ ...validMonthlyProps, description: '' }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un montant a zero', () => {
    expect(() =>
      RecurringEntry.create({ ...validMonthlyProps, amount: 0 }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un montant non-number', () => {
    expect(() =>
      RecurringEntry.create({
        ...validMonthlyProps,
        amount: 'abc' as unknown as number,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un type invalide', () => {
    expect(() =>
      RecurringEntry.create({ ...validMonthlyProps, type: 'INVALID' }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser une frequence invalide', () => {
    expect(() =>
      RecurringEntry.create({
        ...validMonthlyProps,
        frequency: 'DAILY' as string,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser MONTHLY sans dayOfMonth', () => {
    expect(() =>
      RecurringEntry.create({ ...validMonthlyProps, dayOfMonth: null }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser MONTHLY avec dayOfMonth hors 1-31', () => {
    expect(() =>
      RecurringEntry.create({ ...validMonthlyProps, dayOfMonth: 0 }),
    ).toThrow(DomainValidationError);
    expect(() =>
      RecurringEntry.create({ ...validMonthlyProps, dayOfMonth: 32 }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser WEEKLY sans dayOfWeek', () => {
    expect(() =>
      RecurringEntry.create({ ...validWeeklyProps, dayOfWeek: null }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser WEEKLY avec dayOfWeek hors 0-6', () => {
    expect(() =>
      RecurringEntry.create({ ...validWeeklyProps, dayOfWeek: -1 }),
    ).toThrow(DomainValidationError);
    expect(() =>
      RecurringEntry.create({ ...validWeeklyProps, dayOfWeek: 7 }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser une endDate avant startDate', () => {
    expect(() =>
      RecurringEntry.create({
        ...validMonthlyProps,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-01-01'),
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un groupId vide', () => {
    expect(() =>
      RecurringEntry.create({ ...validMonthlyProps, groupId: '  ' }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un createdByUserId vide', () => {
    expect(() =>
      RecurringEntry.create({ ...validMonthlyProps, createdByUserId: '  ' }),
    ).toThrow(DomainValidationError);
  });

  it('devrait accepter categoryId null par defaut', () => {
    const entry = RecurringEntry.create({
      ...validMonthlyProps,
      categoryId: null,
    });

    expect(entry.categoryId).toBeNull();
  });

  it('devrait accepter un montant positif', () => {
    const entry = RecurringEntry.create({
      ...validMonthlyProps,
      amount: 2500,
    });

    expect(entry.amount).toBe(2500);
  });

  it('devrait refuser une startDate invalide', () => {
    expect(() =>
      RecurringEntry.create({
        ...validMonthlyProps,
        startDate: new Date('invalid'),
      }),
    ).toThrow(DomainValidationError);
  });
});
