import { clicsDeRecopie, gesteDeRecopie } from './feuilles';

describe('QA-11 · geste de recopie d’un atelier tableur, un clic par ligne', () => {
  it.each([
    [1, 'cliquez une fois sur « Recopier vers le bas »'],
    [4, 'cliquez quatre fois sur « Recopier vers le bas »'],
    [15, 'cliquez quinze fois sur « Recopier vers le bas »'],
    [17, 'cliquez dix-sept fois sur « Recopier vers le bas »'],
  ])('écrit %i clic(s) en lettres', (clics, attendu) => {
    expect(clicsDeRecopie(clics)).toBe(attendu);
  });

  it.each([0, -1, 2.5, 21, Number.NaN])(
    'refuse une recopie de %p clic(s)',
    (clics) => {
      expect(() => clicsDeRecopie(clics)).toThrow(RangeError);
    },
  );

  it('compte les clics de la cellule source à la dernière ligne recopiée', () => {
    expect(gesteDeRecopie(['D2'], 5)).toBe(
      'sélectionnez D2 et cliquez trois fois sur « Recopier vers le bas », une ligne par clic',
    );
  });

  it('nomme chaque colonne recopiée jusqu’à la même ligne', () => {
    expect(gesteDeRecopie(['D2', 'E2'], 6)).toBe(
      'sélectionnez D2 et cliquez quatre fois sur « Recopier vers le bas », une ligne par clic, puis de même depuis E2',
    );
  });
});
