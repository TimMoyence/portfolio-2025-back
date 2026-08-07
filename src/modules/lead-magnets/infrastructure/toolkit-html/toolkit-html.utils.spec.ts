import { buildToolkitCss } from './toolkit-html.css';
import {
  escapeHtml,
  pageFooter,
  safeHtml,
  sectionHeader,
} from './toolkit-html.utils';
import type { EscapedHtml } from './toolkit-html.utils';

describe('sectionHeader', () => {
  it('echappe le numero, le titre et le sous-titre', () => {
    const header = sectionHeader('<n>', '<t>', '<s>');

    expect(header).toContain('&lt;n&gt;');
    expect(header).toContain('&lt;t&gt;');
    expect(header).toContain('&lt;s&gt;');
    expect(header).not.toContain('<n>');
    expect(header).not.toContain('<t>');
  });

  it('produit un fragment marque, interpolable sans re-echappement', () => {
    const header: EscapedHtml = sectionHeader('01', 'Cheatsheet', 'Vos outils');

    expect(safeHtml`<section>${header}</section>`).toContain(
      '<header class="section-header">',
    );
  });
});

describe('pageFooter', () => {
  it('produit un fragment marque vide', () => {
    const footer: EscapedHtml = pageFooter();

    expect(footer).toBe('');
  });
});

describe('buildToolkitCss', () => {
  it('produit un fragment marque insere verbatim dans une balise style', () => {
    const css: EscapedHtml = buildToolkitCss();

    expect(safeHtml`<style>${css}</style>`).toContain('--accent: #4fb3a2;');
  });
});

describe('etancheite du type cote toolkit', () => {
  it('accepte le fragment produit par escapeHtml', () => {
    const fragment: EscapedHtml = escapeHtml('<b>');

    expect(fragment).toBe('&lt;b&gt;');
  });

  it("refuse a la compilation l'affectation d'une chaine brute", () => {
    const brut = ['<b>', 'brut</b>'].join('');

    // @ts-expect-error une `string` n'est pas un fragment marque
    const fragment: EscapedHtml = brut;

    expect(safeHtml`<p>${fragment}</p>`).toBe('<p><b>brut</b></p>');
  });

  it('refuse a la compilation une chaine brute dans un gabarit', () => {
    const raw = '<script>alert(1)</script>';

    // @ts-expect-error seuls escapeHtml et safeHtml produisent un fragment sur
    const rendered: string = safeHtml`<section>${raw}</section>`;

    expect(rendered).toContain('<script>');
  });

  it('refuse a la compilation un tableau de chaines brutes, motif `.map()` du renderer', () => {
    const cards = ['<script>alert(1)</script>'];

    // @ts-expect-error un `string[]` n'est pas un `readonly EscapedHtml[]`
    const rendered: string = safeHtml`<div>${cards}</div>`;

    expect(rendered).toContain('<script>');
  });
});
