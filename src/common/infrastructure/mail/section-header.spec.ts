import {
  htmlEmis,
  safeHtml,
  type EscapedHtml,
} from '../../domain/texte/html-escape.util';
import { sectionHeader } from './section-header';

describe('sectionHeader', () => {
  it('echappe le numero, le titre et le sous-titre', () => {
    const header = htmlEmis(sectionHeader('<n>', '<t>', '<s>'));

    expect(header).toContain('&lt;n&gt;');
    expect(header).toContain('&lt;t&gt;');
    expect(header).toContain('&lt;s&gt;');
    expect(header).not.toContain('<n>');
    expect(header).not.toContain('<t>');
  });

  it('produit un fragment marque, interpolable sans re-echappement', () => {
    const header: EscapedHtml = sectionHeader('01', 'Cheatsheet', 'Vos outils');

    expect(htmlEmis(safeHtml`<section>${header}</section>`)).toContain(
      '<header class="section-header">',
    );
  });
});
