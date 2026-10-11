import { buildToolkitCss } from './toolkit-html.css';
import { escapeHtml, pageFooter, safeHtml } from './toolkit-html.utils';
import type { EscapedHtml } from './toolkit-html.utils';
import type { FeuilleDeStyle } from '../../../../common/infrastructure/mail/html-escape.util';

describe('pageFooter', () => {
  it('produit un fragment marque vide', () => {
    const footer: EscapedHtml = pageFooter();

    expect(footer).toBe('');
  });
});

describe('buildToolkitCss', () => {
  it('produit une feuille de style inseree verbatim dans une balise style', () => {
    const css: FeuilleDeStyle = buildToolkitCss();

    expect(safeHtml`<style>${css}</style>`).toContain('--accent: #4fb3a2;');
  });

  it('pose la carte outil seule sur toute la largeur de la grille', () => {
    expect(String(buildToolkitCss())).toMatch(
      /\.tool-card-solo\s*\{\s*grid-column: 1 \/ -1;\s*\}/,
    );
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
