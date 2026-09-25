import * as fc from 'fast-check';
import {
  attendreNullPourChaqueValeur,
  nonStringArbitrary,
} from '../../../../test/helpers/fast-check-arbitraries';
import { EmailAddress } from './EmailAddress';

describe('EmailAddress (property-based)', () => {
  it('devrait accepter tout email valide généré par fast-check', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const result = EmailAddress.parse(email);
        expect(result).not.toBeNull();
        expect(result!.value).toBe(email.toLowerCase());
      }),
    );
  });

  it.each<[string, fc.Arbitrary<unknown>]>([
    [
      'devrait rejeter toute chaîne sans @',
      fc.string().filter((s) => !s.includes('@')),
    ],
    [
      "devrait rejeter toute chaîne vide ou composée uniquement d'espaces",
      fc.nat({ max: 320 }).map((n) => ' '.repeat(n)),
    ],
    ['devrait retourner null pour les non-string', nonStringArbitrary],
  ])('%s', (_titre, arbitraire) => {
    attendreNullPourChaqueValeur(arbitraire, (valeur) =>
      EmailAddress.parse(valeur),
    );
  });

  it('devrait toujours retourner une valeur en lowercase', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const result = EmailAddress.parse(email);
        if (result !== null) {
          expect(result.value).toBe(result.value.toLowerCase());
        }
      }),
    );
  });
});
