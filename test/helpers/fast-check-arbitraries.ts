import * as fc from 'fast-check';

export const nonStringArbitrary: fc.Arbitrary<unknown> = fc.oneof(
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
);

export function attendreRejetDeChaqueValeur<T>(
  arbitraire: fc.Arbitrary<T>,
  verifierLeRejet: (valeur: T) => void,
): void {
  fc.assert(fc.property(arbitraire, verifierLeRejet));
}

export function attendreNullPourChaqueValeur<T>(
  arbitraire: fc.Arbitrary<T>,
  parse: (valeur: T) => unknown,
): void {
  attendreRejetDeChaqueValeur(arbitraire, (valeur) => {
    expect(parse(valeur)).toBeNull();
  });
}
