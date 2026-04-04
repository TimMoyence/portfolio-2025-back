import * as fc from 'fast-check';
import { PhoneNumber } from './PhoneNumber';

describe('PhoneNumber', () => {
  it('normalizes phone numbers with international 00 prefix', () => {
    const parsed = PhoneNumber.parse('00 33 (0)1 23 45 67 89');

    expect(parsed).not.toBeNull();
    expect(parsed?.value).toBe('+330123456789');
  });

  it('keeps plain digit local numbers when valid', () => {
    const parsed = PhoneNumber.parse('01 23 45 67 89');

    expect(parsed).not.toBeNull();
    expect(parsed?.value).toBe('0123456789');
  });

  it('returns null for invalid inputs', () => {
    expect(PhoneNumber.parse('abc')).toBeNull();
    expect(PhoneNumber.parse('12')).toBeNull();
    expect(PhoneNumber.parse(`+${'1'.repeat(16)}`)).toBeNull();
    expect(PhoneNumber.parse({})).toBeNull();
  });

  describe('property-based', () => {
    /**
     * Generateur de numeros E.164 valides : +<indicatif 1-3 chiffres><abonne>
     * La longueur totale des chiffres (sans le +) doit etre entre 6 et 15.
     */
    const e164Arb = fc.stringMatching(/^\+[1-9]\d{5,14}$/);

    it('devrait accepter tout numero E.164 valide', () => {
      fc.assert(
        fc.property(e164Arb, (phone) => {
          const result = PhoneNumber.parse(phone);
          expect(result).not.toBeNull();
          // Le numero normalise doit commencer par +
          expect(result!.value.startsWith('+')).toBe(true);
        }),
      );
    });

    it('devrait rejeter tout numero trop court (< 6 chiffres)', () => {
      const shortArb = fc.stringMatching(/^\+\d{1,5}$/);

      fc.assert(
        fc.property(shortArb, (phone) => {
          expect(PhoneNumber.parse(phone)).toBeNull();
        }),
      );
    });

    it('devrait rejeter tout numero trop long (> 15 chiffres)', () => {
      const longArb = fc.stringMatching(/^\+\d{16,25}$/);

      fc.assert(
        fc.property(longArb, (phone) => {
          expect(PhoneNumber.parse(phone)).toBeNull();
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
            expect(PhoneNumber.parse(input)).toBeNull();
          },
        ),
      );
    });

    it('devrait rejeter les chaines contenant des lettres', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => /[a-zA-Z]/.test(s)),
          (input) => {
            expect(PhoneNumber.parse(input)).toBeNull();
          },
        ),
      );
    });
  });
});
