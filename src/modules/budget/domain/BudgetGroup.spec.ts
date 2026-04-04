import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { BudgetGroup } from './BudgetGroup';

describe('BudgetGroup', () => {
  it('devrait creer un groupe valide', () => {
    const group = BudgetGroup.create({
      name: 'Budget couple T&M',
      ownerId: 'user-1',
    });

    expect(group.name).toBe('Budget couple T&M');
    expect(group.ownerId).toBe('user-1');
    expect(group.createdAt).toBeInstanceOf(Date);
  });

  it('devrait refuser un nom vide', () => {
    expect(() => BudgetGroup.create({ name: '', ownerId: 'user-1' })).toThrow(
      DomainValidationError,
    );
  });

  it('devrait refuser un ownerId vide', () => {
    expect(() => BudgetGroup.create({ name: 'Budget', ownerId: '' })).toThrow(
      DomainValidationError,
    );
  });

  it('devrait trimmer le nom', () => {
    const group = BudgetGroup.create({
      name: '  Budget couple  ',
      ownerId: 'user-1',
    });
    expect(group.name).toBe('Budget couple');
  });

  it('devrait trimmer le ownerId', () => {
    const group = BudgetGroup.create({
      name: 'Budget',
      ownerId: '  user-1  ',
    });
    expect(group.ownerId).toBe('user-1');
  });

  it('devrait refuser un ownerId uniquement fait d espaces', () => {
    expect(() =>
      BudgetGroup.create({ name: 'Budget', ownerId: '   ' }),
    ).toThrow(DomainValidationError);
  });

  it('devrait avoir createdAt et updatedAt', () => {
    const group = BudgetGroup.create({
      name: 'Budget',
      ownerId: 'user-1',
    });
    expect(group.createdAt).toBeInstanceOf(Date);
    expect(group.updatedAt).toBeInstanceOf(Date);
  });
});
