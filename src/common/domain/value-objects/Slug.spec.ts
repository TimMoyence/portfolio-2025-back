import { DomainValidationError } from '../errors/DomainValidationError';
import { Slug } from './Slug';

describe('Slug', () => {
  it('devrait parser un slug valide', () => {
    const slug = Slug.parse('mon-slug', 'test');
    expect(slug.toString()).toBe('mon-slug');
  });

  it('devrait normaliser en minuscules', () => {
    const slug = Slug.parse('  MON-SLUG  ', 'test');
    expect(slug.toString()).toBe('mon-slug');
  });

  it('devrait rejeter un slug trop court (< 2)', () => {
    expect(() => Slug.parse('a', 'test')).toThrow(DomainValidationError);
  });

  it('devrait rejeter un slug trop long (> 120)', () => {
    const longSlug = 'a'.repeat(121);
    expect(() => Slug.parse(longSlug, 'test')).toThrow(DomainValidationError);
  });

  it('devrait rejeter un slug avec des caracteres invalides', () => {
    expect(() => Slug.parse('mon_slug', 'test')).toThrow(DomainValidationError);
    expect(() => Slug.parse('mon slug', 'test')).toThrow(DomainValidationError);
    expect(() => Slug.parse('-mon-slug', 'test')).toThrow(
      DomainValidationError,
    );
    expect(() => Slug.parse('mon-slug-', 'test')).toThrow(
      DomainValidationError,
    );
    expect(() => Slug.parse('mon--slug', 'test')).toThrow(
      DomainValidationError,
    );
  });

  it('devrait rejeter une valeur non-string', () => {
    expect(() => Slug.parse(42, 'test')).toThrow(DomainValidationError);
    expect(() => Slug.parse(null, 'test')).toThrow(DomainValidationError);
    expect(() => Slug.parse(undefined, 'test')).toThrow(DomainValidationError);
  });

  it('devrait retourner la valeur via toString()', () => {
    const slug = Slug.parse('technical-seo', 'test');
    expect(slug.toString()).toBe('technical-seo');
    expect(`${slug.toString()}`).toBe('technical-seo');
  });
});
