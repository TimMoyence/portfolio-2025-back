import * as fc from 'fast-check';

export const nonStringArbitrary: fc.Arbitrary<unknown> = fc.oneof(
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
);
