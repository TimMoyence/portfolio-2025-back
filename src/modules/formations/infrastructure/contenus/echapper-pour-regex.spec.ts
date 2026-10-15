import { echapperPourRegex } from '../../../../../test/helpers/echapper-pour-regex';

describe('echapperPourRegex', () => {
  it('fait lire chaque caractère spécial comme lui-même', () => {
    const texte = '.*+?^${}()|[]\\ 1,5';
    expect(new RegExp(`^${echapperPourRegex(texte)}$`, 'u').test(texte)).toBe(
      true,
    );
  });

  it('ne laisse pas le point d un nom de fichier valoir n importe quel caractère', () => {
    const motif = new RegExp(`^${echapperPourRegex('b2-01.xlsx')}$`, 'u');
    expect(motif.test('b2-01Xxlsx')).toBe(false);
  });
});
