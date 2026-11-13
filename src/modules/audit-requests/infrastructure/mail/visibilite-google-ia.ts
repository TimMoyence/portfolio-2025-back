import type { ClientReportSynthesis } from '../../domain/score/AuditReportTiers';
import type { AuditLocale } from '../../domain/traitement/audit-locale.util';
import { escapeHtml, safeHtml, type EscapedHtml } from './mail-rendering.util';

type MatriceDeVisibilite = ClientReportSynthesis['googleVsAiMatrix'];

interface Visibilite {
  readonly moteur: string;
  readonly score: number;
  readonly resume: string;
}

const MOTEURS: Readonly<
  Record<AuditLocale, { google: string; ia: string; deuxPoints: string }>
> = {
  fr: { google: 'Google', ia: 'IA', deuxPoints: ' :' },
  en: { google: 'Google', ia: 'AI', deuxPoints: ':' },
};

function visibilitesDe(
  matrice: MatriceDeVisibilite,
  locale: AuditLocale,
): readonly Visibilite[] {
  const { google, ia, deuxPoints } = MOTEURS[locale];
  return [
    {
      moteur: `${google}${deuxPoints}`,
      score: matrice.googleVisibility.score,
      resume: matrice.googleVisibility.summary,
    },
    {
      moteur: `${ia}${deuxPoints}`,
      score: matrice.aiVisibility.score,
      resume: matrice.aiVisibility.summary,
    },
  ];
}

export function lignesDeVisibilite(
  matrice: MatriceDeVisibilite,
  locale: AuditLocale,
): string[] {
  return visibilitesDe(matrice, locale).map(
    ({ moteur, score, resume }) => `${moteur} ${score}/100 — ${resume}`,
  );
}

export function listeDeVisibilite(
  matrice: MatriceDeVisibilite,
  locale: AuditLocale,
): EscapedHtml {
  const elements = visibilitesDe(matrice, locale).map(
    ({ moteur, score, resume }) =>
      safeHtml`<li><strong>${escapeHtml(moteur)}</strong> ${score}/100 — ${escapeHtml(resume)}</li>`,
  );
  return safeHtml`<ul style="padding-left:20px;color:#374151;">${elements}</ul>`;
}
