import { isFreeRangeValid } from './PacingMode';

describe('isFreeRangeValid', () => {
  it('accepte un intervalle croissant dans les bornes du cours', () => {
    expect(isFreeRangeValid({ premier: 2, dernier: 5 }, 10)).toBe(true);
  });

  it('refuse un intervalle inverse', () => {
    expect(isFreeRangeValid({ premier: 5, dernier: 2 }, 10)).toBe(false);
  });

  it('refuse une borne negative', () => {
    expect(isFreeRangeValid({ premier: -1, dernier: 2 }, 10)).toBe(false);
  });

  it('refuse des bornes non entieres', () => {
    expect(isFreeRangeValid({ premier: 1.5, dernier: 3 }, 10)).toBe(false);
  });

  it('accepte un intervalle d un seul ecran', () => {
    expect(isFreeRangeValid({ premier: 3, dernier: 3 }, 10)).toBe(true);
  });

  it('refuse un intervalle qui deborde le nombre d ecrans fourni', () => {
    expect(isFreeRangeValid({ premier: 8, dernier: 10 }, 10)).toBe(false);
  });

  it('accepte un intervalle sans verifier de borne haute quand totalEcrans est omis', () => {
    expect(isFreeRangeValid({ premier: 8, dernier: 10000 })).toBe(true);
  });
});
