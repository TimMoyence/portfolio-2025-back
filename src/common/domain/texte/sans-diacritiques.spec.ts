import { sansDiacritiques } from './sans-diacritiques';

describe('sansDiacritiques', () => {
  it.each([
    ['Élève à l’école', 'Eleve a l’ecole'],
    ['ça, où, île, naïf', 'ca, ou, ile, naif'],
    ['déjà', 'deja'],
    ['', ''],
  ])('retire les marques combinantes de %p', (brut, attendu) => {
    expect(sansDiacritiques(brut)).toBe(attendu);
  });

  it('retire une marque combinante déjà décomposée', () => {
    expect(sansDiacritiques('é')).toBe('e');
  });

  it('garde la casse et les symboles', () => {
    expect(sansDiacritiques('Prix : 12 € (TTC)')).toBe('Prix : 12 € (TTC)');
  });
});
