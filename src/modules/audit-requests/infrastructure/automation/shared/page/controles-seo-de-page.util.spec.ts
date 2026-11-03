import {
  baliseAbsente,
  canonicalNonConforme,
  h1NonConforme,
  texteDeBalise,
} from './controles-seo-de-page.util';

describe('texteDeBalise', () => {
  it.each([
    [null, ''],
    [undefined, ''],
    ['  Titre  ', 'Titre'],
  ])('lit %p comme %p', (valeur, attendu) => {
    expect(texteDeBalise(valeur)).toBe(attendu);
  });
});

describe('baliseAbsente', () => {
  it.each([[null], [undefined], [''], ['   ']])(
    'tient %p pour absente',
    (valeur) => {
      expect(baliseAbsente(valeur)).toBe(true);
    },
  );

  it('tient un texte pour present', () => {
    expect(baliseAbsente(' Titre ')).toBe(false);
  });
});

describe('h1NonConforme', () => {
  it.each([
    [undefined, false],
    [1, false],
    [0, true],
    [2, true],
  ])('h1Count %p non conforme : %p', (h1Count, attendu) => {
    expect(h1NonConforme({ h1Count })).toBe(attendu);
  });
});

describe('canonicalNonConforme', () => {
  const CANONIQUE = 'https://example.com/';

  it.each([
    [null, 1, true],
    [CANONIQUE, undefined, true],
    [CANONIQUE, 0, true],
    [CANONIQUE, 2, true],
    [CANONIQUE, 1, false],
  ])(
    'canonical %p en %p exemplaire(s) non conforme : %p',
    (canonical, canonicalCount, attendu) => {
      expect(canonicalNonConforme({ canonical, canonicalCount })).toBe(attendu);
    },
  );
});
