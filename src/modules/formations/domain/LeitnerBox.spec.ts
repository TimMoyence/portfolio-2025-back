import { isDue, nextBox, SEANCES_AVANT_REVISION } from './LeitnerBox';

describe('nextBox', () => {
  it('monte d une boite apres une reussite', () => {
    expect(nextBox(1, true)).toBe(2);
    expect(nextBox(2, true)).toBe(3);
  });

  it('plafonne a la troisieme boite', () => {
    expect(nextBox(3, true)).toBe(3);
  });

  it('redescend en premiere boite apres un echec', () => {
    expect(nextBox(2, false)).toBe(1);
    expect(nextBox(3, false)).toBe(1);
    expect(nextBox(1, false)).toBe(1);
  });
});

describe('SEANCES_AVANT_REVISION', () => {
  it('espace les revisions de une, deux puis cinq seances', () => {
    expect(SEANCES_AVANT_REVISION).toEqual({ 1: 1, 2: 2, 3: 5 });
  });
});

describe('isDue', () => {
  it('declare du un concept dont l echeance est passee', () => {
    const mastery = { boite: 1 as const, seancesDepuisDerniereVue: 2 };
    expect(isDue(mastery)).toBe(true);
  });

  it('ne declare pas du un concept revu recemment', () => {
    const mastery = { boite: 3 as const, seancesDepuisDerniereVue: 2 };
    expect(isDue(mastery)).toBe(false);
  });

  it('declare du un concept exactement a l echeance', () => {
    const mastery = { boite: 2 as const, seancesDepuisDerniereVue: 2 };
    expect(isDue(mastery)).toBe(true);
  });
});
