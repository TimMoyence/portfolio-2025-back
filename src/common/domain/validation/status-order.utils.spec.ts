import { DomainValidationError } from '../errors/DomainValidationError';
import { resolvePublishableStatus, resolveOrder } from './status-order.utils';

describe('resolvePublishableStatus', () => {
  it('devrait retourner PUBLISHED par defaut si null ou undefined', () => {
    expect(resolvePublishableStatus(null, 'status')).toBe('PUBLISHED');
    expect(resolvePublishableStatus(undefined, 'status')).toBe('PUBLISHED');
  });

  it('devrait accepter les trois statuts valides', () => {
    expect(resolvePublishableStatus('DRAFT', 'status')).toBe('DRAFT');
    expect(resolvePublishableStatus('PUBLISHED', 'status')).toBe('PUBLISHED');
    expect(resolvePublishableStatus('ARCHIVED', 'status')).toBe('ARCHIVED');
  });

  it('devrait normaliser la casse (trim + uppercase)', () => {
    expect(resolvePublishableStatus('  draft  ', 'status')).toBe('DRAFT');
    expect(resolvePublishableStatus('published', 'status')).toBe('PUBLISHED');
    expect(resolvePublishableStatus('Archived', 'status')).toBe('ARCHIVED');
  });

  it('devrait rejeter un non-string', () => {
    expect(() => resolvePublishableStatus(42, 'status')).toThrow(
      DomainValidationError,
    );
    expect(() => resolvePublishableStatus(true, 'status')).toThrow(
      DomainValidationError,
    );
  });

  it('devrait rejeter une valeur string invalide', () => {
    expect(() => resolvePublishableStatus('INVALID', 'status')).toThrow(
      DomainValidationError,
    );
  });

  it('devrait inclure le nom du champ dans le message d erreur', () => {
    expect(() => resolvePublishableStatus('BAD', 'project status')).toThrow(
      'Invalid project status',
    );
  });
});

describe('resolveOrder', () => {
  it('devrait retourner 0 par defaut si null ou undefined', () => {
    expect(resolveOrder(null, 'order')).toBe(0);
    expect(resolveOrder(undefined, 'order')).toBe(0);
  });

  it('devrait accepter un entier positif valide', () => {
    expect(resolveOrder(0, 'order')).toBe(0);
    expect(resolveOrder(1, 'order')).toBe(1);
    expect(resolveOrder(10000, 'order')).toBe(10000);
  });

  it('devrait rejeter un nombre non entier', () => {
    expect(() => resolveOrder(1.5, 'order')).toThrow(DomainValidationError);
  });

  it('devrait rejeter un nombre negatif', () => {
    expect(() => resolveOrder(-1, 'order')).toThrow(DomainValidationError);
  });

  it('devrait rejeter un nombre superieur a 10000', () => {
    expect(() => resolveOrder(10001, 'order')).toThrow(DomainValidationError);
  });

  it('devrait rejeter un non-nombre', () => {
    expect(() => resolveOrder('abc', 'order')).toThrow(DomainValidationError);
  });

  it('devrait inclure le nom du champ dans le message d erreur', () => {
    expect(() => resolveOrder(-1, 'project order')).toThrow(
      'Invalid project order',
    );
  });
});
