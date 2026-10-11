import { adresseNue, entetesDeDesabonnement } from './entetes-de-desabonnement';

describe('adresseNue', () => {
  it.each([
    ['contact@asilidesign.fr', 'contact@asilidesign.fr'],
    ['  contact@asilidesign.fr ', 'contact@asilidesign.fr'],
    ["'Asili Design' <contact@asilidesign.fr>", 'contact@asilidesign.fr'],
    ['Tim < contact@asilidesign.fr >', 'contact@asilidesign.fr'],
    ['Tim <contact@asilidesign.fr', 'Tim <contact@asilidesign.fr'],
  ])('réduit %p à l adresse seule', (brut, attendu) => {
    expect(adresseNue(brut)).toBe(attendu);
  });
});

describe('entetesDeDesabonnement', () => {
  it('annonce le mailto nu et le lien en un clic, conformes à la RFC 8058', () => {
    expect(
      entetesDeDesabonnement(
        'Tim <contact@asilidesign.fr>',
        'https://asilidesign.fr/api/newsletter/unsubscribe?token=t',
      ),
    ).toEqual({
      'List-Unsubscribe':
        '<mailto:contact@asilidesign.fr?subject=unsubscribe>, <https://asilidesign.fr/api/newsletter/unsubscribe?token=t>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });
});
