import { estUneProduction, texteDeValeur } from './ValeurReponse';

describe('ValeurReponse', () => {
  const production = {
    type: 'classement',
    classement: { a: 'b' },
  } as const;

  it('reconnaît une production, jamais une réponse simple', () => {
    expect(estUneProduction(production)).toBe(true);
    expect(estUneProduction('B')).toBe(false);
    expect(estUneProduction(3)).toBe(false);
  });

  it('lit une production par son type et une réponse simple telle quelle', () => {
    expect(texteDeValeur(production)).toBe('classement');
    expect(texteDeValeur(3)).toBe('3');
  });
});
