import { lienAvecJeton } from './lien-avec-jeton';

describe('lienAvecJeton', () => {
  it('ajoute le jeton en parametre de requete', () => {
    expect(lienAvecJeton('https://asilidesign.fr/verify-email', 'abc')).toBe(
      'https://asilidesign.fr/verify-email?token=abc',
    );
  });

  it('remplace un jeton deja present et garde les autres parametres', () => {
    expect(
      lienAvecJeton('https://asilidesign.fr/reset?lang=fr&token=old', 'abc'),
    ).toBe('https://asilidesign.fr/reset?lang=fr&token=abc');
  });

  it('ajoute le jeton encode a une base relative', () => {
    expect(lienAvecJeton('/reset?lang=fr', 'a b')).toBe(
      '/reset?lang=fr&token=a%20b',
    );
    expect(lienAvecJeton('/verify', 'abc')).toBe('/verify?token=abc');
  });
});
