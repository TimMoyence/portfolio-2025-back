import type { ClientReportSynthesis } from '../../domain/AuditReportTiers';
import { escapeHtml, safeHtml, type EscapedHtml } from './mail-rendering.util';

type MatriceDeVisibilite = ClientReportSynthesis['googleVsAiMatrix'];

interface Visibilite {
  readonly moteur: 'Google' | 'IA';
  readonly score: number;
  readonly resume: string;
}

function visibilitesDe(matrice: MatriceDeVisibilite): readonly Visibilite[] {
  return [
    {
      moteur: 'Google',
      score: matrice.googleVisibility.score,
      resume: matrice.googleVisibility.summary,
    },
    {
      moteur: 'IA',
      score: matrice.aiVisibility.score,
      resume: matrice.aiVisibility.summary,
    },
  ];
}

export function lignesDeVisibilite(matrice: MatriceDeVisibilite): string[] {
  return visibilitesDe(matrice).map(
    ({ moteur, score, resume }) => `${moteur} : ${score}/100 — ${resume}`,
  );
}

export function listeDeVisibilite(matrice: MatriceDeVisibilite): EscapedHtml {
  const elements = visibilitesDe(matrice).map(
    ({ moteur, score, resume }) =>
      safeHtml`<li><strong>${escapeHtml(moteur)} :</strong> ${score}/100 — ${escapeHtml(resume)}</li>`,
  );
  return safeHtml`<ul style="padding-left:20px;color:#374151;">${elements}</ul>`;
}
