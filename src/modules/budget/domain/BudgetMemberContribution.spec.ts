import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { BudgetMemberContribution } from './BudgetMemberContribution';

describe('BudgetMemberContribution', () => {
  it('devrait creer une contribution valide', () => {
    const contribution = BudgetMemberContribution.create({
      groupId: 'group-1',
      userId: 'user-1',
      month: 5,
      year: 2026,
      monthlySalary: 2500,
    });

    expect(contribution.groupId).toBe('group-1');
    expect(contribution.userId).toBe('user-1');
    expect(contribution.month).toBe(5);
    expect(contribution.year).toBe(2026);
    expect(contribution.monthlySalary).toBe(2500);
    expect(contribution.createdAt).toBeInstanceOf(Date);
    expect(contribution.updatedAt).toBeInstanceOf(Date);
  });

  it('devrait accepter un monthlySalary egal a zero', () => {
    const contribution = BudgetMemberContribution.create({
      groupId: 'group-1',
      userId: 'user-1',
      month: 1,
      year: 2026,
      monthlySalary: 0,
    });

    expect(contribution.monthlySalary).toBe(0);
  });

  it('devrait refuser un monthlySalary negatif', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 5,
        year: 2026,
        monthlySalary: -1,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un monthlySalary non-number', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 5,
        year: 2026,
        monthlySalary: 'abc' as unknown as number,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un monthlySalary NaN', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 5,
        year: 2026,
        monthlySalary: Number.NaN,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un monthlySalary Infinity', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 5,
        year: 2026,
        monthlySalary: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un monthlySalary -Infinity', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 5,
        year: 2026,
        monthlySalary: Number.NEGATIVE_INFINITY,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un month inferieur a 1', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 0,
        year: 2026,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un month superieur a 12', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 13,
        year: 2026,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait accepter month=1 (borne basse)', () => {
    const contribution = BudgetMemberContribution.create({
      groupId: 'group-1',
      userId: 'user-1',
      month: 1,
      year: 2026,
      monthlySalary: 2500,
    });

    expect(contribution.month).toBe(1);
  });

  it('devrait accepter month=12 (borne haute)', () => {
    const contribution = BudgetMemberContribution.create({
      groupId: 'group-1',
      userId: 'user-1',
      month: 12,
      year: 2026,
      monthlySalary: 2500,
    });

    expect(contribution.month).toBe(12);
  });

  it('devrait refuser un year inferieur a 2000', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 5,
        year: 1999,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un year superieur a 2100', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 5,
        year: 2101,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait accepter year=2000 (borne basse)', () => {
    const contribution = BudgetMemberContribution.create({
      groupId: 'group-1',
      userId: 'user-1',
      month: 5,
      year: 2000,
      monthlySalary: 2500,
    });

    expect(contribution.year).toBe(2000);
  });

  it('devrait accepter year=2100 (borne haute)', () => {
    const contribution = BudgetMemberContribution.create({
      groupId: 'group-1',
      userId: 'user-1',
      month: 5,
      year: 2100,
      monthlySalary: 2500,
    });

    expect(contribution.year).toBe(2100);
  });

  it('devrait refuser un month non entier', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 5.5,
        year: 2026,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un year non entier', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: 'user-1',
        month: 5,
        year: 2026.5,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un groupId vide', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: '',
        userId: 'user-1',
        month: 5,
        year: 2026,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un groupId whitespace', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: '   ',
        userId: 'user-1',
        month: 5,
        year: 2026,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un userId vide', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: '',
        month: 5,
        year: 2026,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser un userId whitespace', () => {
    expect(() =>
      BudgetMemberContribution.create({
        groupId: 'group-1',
        userId: '   ',
        month: 5,
        year: 2026,
        monthlySalary: 2500,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait conserver les id, createdAt et updatedAt fournis', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const updatedAt = new Date('2026-02-01T00:00:00Z');
    const contribution = BudgetMemberContribution.create({
      id: 'contribution-1',
      groupId: 'group-1',
      userId: 'user-1',
      month: 5,
      year: 2026,
      monthlySalary: 2500,
      createdAt,
      updatedAt,
    });

    expect(contribution.id).toBe('contribution-1');
    expect(contribution.createdAt).toEqual(createdAt);
    expect(contribution.updatedAt).toEqual(updatedAt);
  });
});
