import * as fc from 'fast-check';
import { LocaleCode } from './LocaleCode';

describe('LocaleCode', () => {
  it('parses locale variants to supported language code', () => {
    expect(LocaleCode.parse('fr')?.value).toBe('fr');
    expect(LocaleCode.parse('fr-FR')?.value).toBe('fr');
    expect(LocaleCode.parse('EN-us')?.value).toBe('en');
  });

  it('returns null for unsupported locale', () => {
    expect(LocaleCode.parse('es')).toBeNull();
    expect(LocaleCode.parse('')).toBeNull();
    expect(LocaleCode.parse(12)).toBeNull();
  });

  it('resolves fallback when input is invalid', () => {
    expect(LocaleCode.resolve('es').value).toBe('fr');
    expect(LocaleCode.resolve(null, 'en').value).toBe('en');
  });

  describe('property-based', () => {
    /**
     * Generateur de codes locales "fr" valides : "fr" ou "fr-<subtag>"
     */
    const frVariantArb = fc.oneof(
      fc.constant('fr'),
      fc.stringMatching(/^[a-zA-Z]{1,8}$/).map((suffix) => `fr-${suffix}`),
    );

    /**
     * Generateur de codes locales "en" valides : "en" ou "en-<subtag>"
     */
    const enVariantArb = fc.oneof(
      fc.constant('en'),
      fc.stringMatching(/^[a-zA-Z]{1,8}$/).map((suffix) => `en-${suffix}`),
    );

    it('devrait accepter toutes les variantes "fr" (fr, fr-FR, fr-CA, ...)', () => {
      fc.assert(
        fc.property(frVariantArb, (locale) => {
          const result = LocaleCode.parse(locale);
          expect(result).not.toBeNull();
          expect(result!.value).toBe('fr');
        }),
      );
    });

    it('devrait accepter toutes les variantes "en" (en, en-US, en-GB, ...)', () => {
      fc.assert(
        fc.property(enVariantArb, (locale) => {
          const result = LocaleCode.parse(locale);
          expect(result).not.toBeNull();
          expect(result!.value).toBe('en');
        }),
      );
    });

    it('devrait accepter les codes valides quelle que soit la casse', () => {
      fc.assert(
        fc.property(
          fc.oneof(frVariantArb, enVariantArb),
          fc.boolean(),
          (locale, upper) => {
            const input = upper ? locale.toUpperCase() : locale.toLowerCase();
            const result = LocaleCode.parse(input);
            expect(result).not.toBeNull();
          },
        ),
      );
    });

    it('devrait rejeter les codes de langues non supportees', () => {
      // Genere des codes ISO-like qui ne commencent ni par "fr" ni par "en"
      const unsupportedArb = fc
        .stringMatching(/^[a-z]{2,5}$/)
        .filter((s) => !s.startsWith('fr') && !s.startsWith('en'));

      fc.assert(
        fc.property(unsupportedArb, (locale) => {
          expect(LocaleCode.parse(locale)).toBeNull();
        }),
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
            expect(LocaleCode.parse(input)).toBeNull();
          },
        ),
      );
    });

    it('devrait toujours fournir un fallback via resolve()', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.constant(null),
            fc.constant(undefined),
          ),
          (input) => {
            const result = LocaleCode.resolve(input);
            // resolve() ne retourne jamais null
            expect(result).not.toBeNull();
            expect(['fr', 'en']).toContain(result.value);
          },
        ),
      );
    });
  });
});
