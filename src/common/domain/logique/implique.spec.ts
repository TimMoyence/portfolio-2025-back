import { implique } from './implique';

describe('implique', () => {
  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, true],
    [false, false, true],
  ])(
    'P = %s, Q = %s donne P ⇒ Q = %s : fausse seulement si P est vraie et Q fausse',
    (p, q, attendue) => {
      expect(implique(p, q)).toBe(attendue);
    },
  );
});
