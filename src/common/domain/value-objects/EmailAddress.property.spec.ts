import * as fc from 'fast-check';
import { EmailAddress } from './EmailAddress';

/**
 * Tests property-based pour le Value Object EmailAddress.
 * Utilise fast-check pour générer des entrées aléatoires et vérifier
 * les invariants du parsing d'emails.
 */
describe('EmailAddress (property-based)', () => {
  it('devrait accepter tout email valide généré par fast-check', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const result = EmailAddress.parse(email);
        expect(result).not.toBeNull();
        // Vérifier que l'email normalisé est en lowercase
        expect(result!.value).toBe(email.toLowerCase());
      }),
    );
  });

  it('devrait rejeter toute chaîne sans @', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes('@')),
        (input) => {
          const result = EmailAddress.parse(input);
          expect(result).toBeNull();
        },
      ),
    );
  });

  it("devrait rejeter toute chaîne vide ou composée uniquement d'espaces", () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 320 }).map((n) => ' '.repeat(n)),
        (input) => {
          const result = EmailAddress.parse(input);
          expect(result).toBeNull();
        },
      ),
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

  it('devrait retourner null pour les non-string', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
        ),
        (input) => {
          const result = EmailAddress.parse(input);
          expect(result).toBeNull();
        },
      ),
    );
  });
});
