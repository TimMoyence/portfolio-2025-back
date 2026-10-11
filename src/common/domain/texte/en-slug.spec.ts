import { enSlug } from './en-slug';

describe('enSlug', () => {
  it.each([
    ['Audit de Café Élysée', 'audit-de-cafe-elysee'],
    ['  --Déjà vu !--  ', 'deja-vu'],
    ['§§§', ''],
  ])(
    'ecrit %p en minuscules ASCII separees par des tirets',
    (brut, attendu) => {
      expect(enSlug(brut, 60)).toBe(attendu);
    },
  );

  it('coupe a la longueur maximale sans laisser de tiret final', () => {
    expect(enSlug('abcd efgh', 5)).toBe('abcd');
  });
});
