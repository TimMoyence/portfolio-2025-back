import { plafondAtteint, TROIS_ENVOIS_PAR_HEURE } from './PlafondDEnvois';

describe('plafondAtteint', () => {
  it.each([
    [0, false],
    [2, false],
    [3, true],
    [4, true],
  ])(
    'avec %i envois deja poses dans la fenetre, le plafond de trois atteint vaut %p',
    (recents, atteint) => {
      expect(plafondAtteint(TROIS_ENVOIS_PAR_HEURE, recents)).toBe(atteint);
    },
  );
});
