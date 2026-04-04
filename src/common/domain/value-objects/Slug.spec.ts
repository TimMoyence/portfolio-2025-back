import * as fc from 'fast-check';
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

  describe('property-based', () => {
    /**
     * Generateur de slugs valides : segments alphanumeriques separes par des tirets.
     * Regex cible : /^[a-z0-9]+(?:-[a-z0-9]+)*$/  (2-120 caracteres)
     */
    const validSlugArb = fc
      .stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      .filter((s) => s.length >= 2 && s.length <= 120);

    it('devrait accepter tout slug alphanum+tirets valide', () => {
      fc.assert(
        fc.property(validSlugArb, (slug) => {
          expect(() => Slug.parse(slug, 'test')).not.toThrow();
          expect(Slug.parse(slug, 'test').toString()).toBe(slug);
        }),
      );
    });

    it('devrait normaliser en minuscules quel que soit le casse', () => {
      fc.assert(
        fc.property(validSlugArb, (slug) => {
          // Passer en majuscules — le parse doit normaliser
          const upper = slug.toUpperCase();
          expect(() => Slug.parse(upper, 'test')).not.toThrow();
          expect(Slug.parse(upper, 'test').toString()).toBe(slug);
        }),
      );
    });

    it('devrait rejeter les chaines avec des caracteres speciaux', () => {
      // Genere des chaines contenant au moins un caractere non-[a-zA-Z0-9-\s]
      const specialCharArb = fc
        .string({ minLength: 2, maxLength: 50 })
        .filter((s) => /[^a-zA-Z0-9\-\s]/.test(s));

      fc.assert(
        fc.property(specialCharArb, (input) => {
          expect(() => Slug.parse(input, 'test')).toThrow(
            DomainValidationError,
          );
        }),
      );
    });

    it('devrait rejeter les slugs trop courts (< 2 caracteres)', () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[a-z0-9]?$/), (input) => {
          expect(() => Slug.parse(input, 'test')).toThrow(
            DomainValidationError,
          );
        }),
      );
    });

    it('devrait rejeter les slugs trop longs (> 120 caracteres)', () => {
      // Genere des chaines de lettres minuscules de longueur 121-200
      fc.assert(
        fc.property(
          fc.integer({ min: 121, max: 200 }).map((len) => 'a'.repeat(len)),
          (input) => {
            expect(() => Slug.parse(input, 'test')).toThrow(
              DomainValidationError,
            );
          },
        ),
      );
    });

    it('devrait rejeter les valeurs non-string', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
          ),
          (input) => {
            expect(() => Slug.parse(input, 'test')).toThrow(
              DomainValidationError,
            );
          },
        ),
      );
    });
  });
});
