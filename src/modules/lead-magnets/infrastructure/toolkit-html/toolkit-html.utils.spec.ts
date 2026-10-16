import { buildToolkitCss } from './toolkit-html.css';
import { escapeHtml, safeHtml } from './toolkit-html.utils';
import type { EscapedHtml } from './toolkit-html.utils';
import {
  htmlEmis,
  type FeuilleDeStyle,
} from '../../../../common/domain/texte/html-escape.util';

describe('buildToolkitCss', () => {
  it('produit une feuille de style inseree verbatim dans une balise style', () => {
    const css: FeuilleDeStyle = buildToolkitCss();

    expect(htmlEmis(safeHtml`<style>${css}</style>`)).toContain(
      '--accent: #4fb3a2;',
    );
  });

  it('pose la carte outil seule sur toute la largeur de la grille', () => {
    expect(htmlEmis(safeHtml`<style>${buildToolkitCss()}</style>`)).toMatch(
      /\.tool-card-solo\s*\{\s*grid-column: 1 \/ -1;\s*\}/,
    );
  });
});

describe('etancheite du type cote toolkit', () => {
  it('accepte le fragment produit par escapeHtml', () => {
    const fragment: EscapedHtml = escapeHtml('<b>');

    expect(htmlEmis(fragment)).toBe('&lt;b&gt;');
  });

  it("refuse a la compilation l'affectation d'une chaine brute, et l echappe au rendu", () => {
    const brut = ['<b>', 'brut</b>'].join('');

    // @ts-expect-error une `string` n'est pas un fragment marque
    const fragment: EscapedHtml = brut;

    expect(htmlEmis(safeHtml`<p>${fragment}</p>`)).toBe(
      '<p>&lt;b&gt;brut&lt;/b&gt;</p>',
    );
  });

  it('refuse a la compilation une chaine brute dans un gabarit, et l echappe au rendu', () => {
    const raw = '<script>alert(1)</script>';

    // @ts-expect-error seuls escapeHtml et safeHtml produisent un fragment sur
    const rendered = htmlEmis(safeHtml`<section>${raw}</section>`);

    expect(rendered).toBe(
      '<section>&lt;script&gt;alert(1)&lt;/script&gt;</section>',
    );
  });

  it('refuse a la compilation un tableau de chaines brutes, motif `.map()` du renderer', () => {
    const cards = ['<script>alert(1)</script>'];

    // @ts-expect-error un `string[]` n'est pas un `readonly EscapedHtml[]`
    const rendered = htmlEmis(safeHtml`<div>${cards}</div>`);

    expect(rendered).toBe('<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>');
  });
});
