import {
  escapeHtml,
  escapeUrl,
  type EscapedHtml,
  safeHtml,
} from '../../../domain/texte/nettoyage/html-escape.util';

export interface CorpsAvecBouton {
  readonly titre: EscapedHtml;
  readonly paragraphes: readonly string[];
  readonly bouton: string;
  readonly lien: string;
  readonly pied: string;
}

export function corpsAvecBouton(corps: CorpsAvecBouton): {
  readonly text: string;
  readonly html: EscapedHtml;
} {
  const paragraphes = corps.paragraphes.map(
    (paragraphe) => safeHtml`<p>${escapeHtml(paragraphe)}</p>`,
  );
  return {
    text: [...corps.paragraphes, corps.lien, corps.pied].join('\n\n'),
    html: safeHtml`
      <div style="font-family:Arial,Helvetica,sans-serif; background:#f7f7f7; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
          <h2 style="margin-top:0; color:#111;">${corps.titre}</h2>
          ${paragraphes}
          <p style="margin:24px 0;">
            <a href="${escapeUrl(corps.lien)}" style="display:inline-block; background:#0f172a; color:#fff; text-decoration:none; padding:12px 18px; border-radius:8px;">${escapeHtml(corps.bouton)}</a>
          </p>
          <p style="word-break:break-all; color:#334155;">${escapeHtml(corps.lien)}</p>
          <p style="font-size:12px; color:#64748b; margin-top:24px;">${escapeHtml(corps.pied)}</p>
        </div>
      </div>
    `,
  };
}
