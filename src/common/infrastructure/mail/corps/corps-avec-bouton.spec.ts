import {
  htmlEmis,
  safeHtml,
} from '../../../domain/texte/nettoyage/html-escape.util';
import { corpsAvecBouton } from './corps-avec-bouton';

const CORPS = {
  titre: safeHtml`Tentative d'inscription`,
  paragraphes: ['Bonjour <Jane>,', 'Second & dernier.'],
  bouton: 'Confirmer',
  lien: 'https://asilidesign.fr/fr/newsletter/confirm?token=abc',
  pied: 'Ignorez cet email si besoin.',
};

describe('corpsAvecBouton', () => {
  it('met dans le texte brut chaque paragraphe, le lien en clair puis le pied', () => {
    expect(corpsAvecBouton(CORPS).text).toBe(
      [
        'Bonjour <Jane>,',
        'Second & dernier.',
        CORPS.lien,
        'Ignorez cet email si besoin.',
      ].join('\n\n'),
    );
  });

  it('pose le titre emis tel quel, echappe le reste et pose le bouton sur le lien', () => {
    const html = htmlEmis(corpsAvecBouton(CORPS).html);

    expect(html).toContain("Tentative d'inscription");
    expect(html).toContain('Bonjour &lt;Jane&gt;,');
    expect(html).toContain('Second &amp; dernier.');
    expect(html).toContain(`href="${CORPS.lien}"`);
    expect(html).toContain('>Confirmer</a>');
  });

  it('ne fait pointer le bouton vers aucun lien qui n est pas une url web', () => {
    const html = htmlEmis(
      corpsAvecBouton({ ...CORPS, lien: 'javascript:alert(1)' }).html,
    );

    expect(html).toContain('<a href="#"');
    expect(html).not.toContain('href="javascript:');
  });
});
