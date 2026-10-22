import * as fc from 'fast-check';
import {
  attendreNullPourChaqueValeur,
  nonStringArbitrary,
} from '../../../../test/helpers/fast-check-arbitraries';
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

  it.each([
    ['0 0 1 2 3 4 5 6', '+123456'],
    ['(+33) 6.12.34.56.78', '+33612345678'],
    ['+00 33 6 12 34 56 78', '+0033612345678'],
  ])('lit %p, séparateurs compris, en %p', (saisie, attendu) => {
    expect(PhoneNumber.parse(saisie)?.value).toBe(attendu);
  });

  it.each(['0012345', '00+33612345678', '33+612345678', '+', '()', ''])(
    'refuse %p : préfixe 00 trop court, plus ailleurs qu en tête, ou rien à composer',
    (saisie) => {
      expect(PhoneNumber.parse(saisie)).toBeNull();
    },
  );

  it('returns null for invalid inputs', () => {
    expect(PhoneNumber.parse('abc')).toBeNull();
    expect(PhoneNumber.parse('12')).toBeNull();
    expect(PhoneNumber.parse(`+${'1'.repeat(16)}`)).toBeNull();
    expect(PhoneNumber.parse({})).toBeNull();
  });

  describe('property-based', () => {
    const e164Arb = fc.stringMatching(/^\+[1-9]\d{5,14}$/);

    it('devrait accepter tout numero E.164 valide', () => {
      fc.assert(
        fc.property(e164Arb, (phone) => {
          const result = PhoneNumber.parse(phone);
          expect(result).not.toBeNull();
          expect(result!.value.startsWith('+')).toBe(true);
        }),
      );
    });

    it.each<[string, fc.Arbitrary<unknown>]>([
      [
        'devrait rejeter tout numero trop court (< 6 chiffres)',
        fc.stringMatching(/^\+\d{1,5}$/),
      ],
      [
        'devrait rejeter tout numero trop long (> 15 chiffres)',
        fc.stringMatching(/^\+\d{16,25}$/),
      ],
      ['devrait rejeter les valeurs non-string', nonStringArbitrary],
      [
        'devrait rejeter les chaines contenant des lettres',
        fc.string({ minLength: 1 }).filter((s) => /[a-zA-Z]/.test(s)),
      ],
    ])('%s', (_titre, arbitraire) => {
      attendreNullPourChaqueValeur(arbitraire, (valeur) =>
        PhoneNumber.parse(valeur),
      );
    });
  });
});
