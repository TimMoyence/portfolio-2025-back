import {
  escapeHtml,
  safeHtml,
  type EscapedHtml,
} from '../../domain/texte/html-escape.util';

export interface CouvertureDePdf {
  readonly formes: number;
  readonly surtitre: string;
  readonly titre: EscapedHtml;
  readonly sousTitre: EscapedHtml;
  readonly meta: readonly EscapedHtml[];
  readonly badges?: readonly EscapedHtml[];
  readonly pied: readonly string[];
}

export function couvertureDePdf({
  formes,
  surtitre,
  titre,
  sousTitre,
  meta,
  badges = [],
  pied,
}: CouvertureDePdf): EscapedHtml {
  const decor = Array.from(
    { length: formes },
    (_, rang) =>
      safeHtml`<div class="cover-shape cover-shape-${rang + 1}"></div>`,
  );
  const mentions = ['asilidesign.fr', ...pied].flatMap((mention, rang) => {
    const span = safeHtml`<span>${escapeHtml(mention)}</span>`;
    return rang === 0 ? [span] : [safeHtml`<span>•</span>`, span];
  });
  const encarts = badges.length
    ? safeHtml`<div class="badges">${badges}</div>`
    : safeHtml``;

  return safeHtml`<section class="page cover">
      <div class="cover-gradient">${decor}</div>
      <div class="cover-content">
        <p class="cover-eyebrow">${escapeHtml(surtitre)}</p>
        <h1 class="cover-title">${titre}</h1>
        <p class="cover-subtitle">${sousTitre}</p>
        <div class="cover-meta">${meta}</div>
        ${encarts}
      </div>
      <footer class="cover-footer">${mentions}</footer>
    </section>`;
}
