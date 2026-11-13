import { Injectable } from '@nestjs/common';
import { libelleOuCle } from '../../../../../common/domain/objets/libelle-ou-cle';
import { pieceJointePdf } from '../../../../../common/infrastructure/mail/piece-jointe';
import { destinataireDesRapportsDAudit } from '../../../../../config/adresses-de-courriel';
import { envString } from '../../../../../config/environnement/env-readers.util';
import { pageDuSite } from '../../../../../config/urls-publiques';
import { adresseDuSite } from '../../../domain/demande/AdresseDuSite';
import {
  LIBELLES_DU_NIVEAU,
  type ReportSeverity,
} from '../../../domain/score/AuditReportTiers';
import type { AuditLocale } from '../../../domain/traitement/audit-locale.util';
import type { ClientReportMailInput } from '../../../domain/traitement/IAuditNotifier.port';
import { rapportClientServi } from '../../../domain/traitement/RapportClientServi';
import type { PillarKey } from '../../../domain/score/Piliers';
import { pillarLabel } from '../../automation/shared/texte/pillar-labels.util';
import { buildMailLayout } from '../mail-layout.util';
import { MailerDAudit } from '../mailer-d-audit';
import {
  escapeHtml,
  escapeUrl,
  safeHtml,
  slugify,
  type EscapedHtml,
} from '../mail-rendering.util';
import { lignesDeVisibilite, listeDeVisibilite } from '../visibilite-google-ia';

const PILIERS_EN_ANGLAIS: Readonly<Record<PillarKey, string>> = {
  seo: 'SEO',
  performance: 'Performance',
  technical: 'Tech & scalability',
  trust: 'Credibility',
  conversion: 'Conversion',
  aiVisibility: 'AI visibility',
  citationWorthiness: 'AI citability',
};

const TEXTES = {
  fr: {
    objet: (site: string) => `Votre audit Growth — ${site}`,
    titreTexte: (site: string) => `VOTRE AUDIT GROWTH — ${site}`,
    salutation: (prenom: string | null) =>
      prenom ? `Bonjour ${prenom},` : 'Bonjour,',
    intro: 'Voici la synthèse stratégique de votre audit.',
    synthese: 'Executive summary',
    visibilite: 'Visibilité Google vs IA',
    constats: 'Top findings',
    aucunConstat: 'Aucun point critique détecté.',
    scorecard: 'Scorecard 7 piliers',
    pilier: 'Pilier',
    scoreCible: 'Score / cible',
    statut: 'Statut',
    quickWinsTitre: 'Quick wins prioritaires',
    quickWinsTexte: 'Quick wins',
    effort: 'Effort :',
    deuxPoints: ' :',
    action: 'Action :',
    pdfJoint: 'Le rapport complet est joint à cet email.',
    pdfAVenir: 'Le rapport détaillé vous sera envoyé dans un second temps.',
    pdfJointTexte: 'Le rapport complet est joint a cet email.',
    pdfAVenirTexte:
      'Le rapport detaille vous sera envoye dans un second temps.',
    sousTitre:
      'Synthèse stratégique 7 piliers + quick wins priorisés par impact/effort',
    preheader: (site: string) =>
      `Audit Growth Asili Design pour ${site} — ouvrez pour voir votre scorecard.`,
    niveau: (niveau: ReportSeverity) => LIBELLES_DU_NIVEAU[niveau],
    nomDuPilier: pillarLabel,
  },
  en: {
    objet: (site: string) => `Your Growth audit — ${site}`,
    titreTexte: (site: string) => `YOUR GROWTH AUDIT — ${site}`,
    salutation: (prenom: string | null) =>
      prenom ? `Hello ${prenom},` : 'Hello,',
    intro: 'Here is the strategic summary of your audit.',
    synthese: 'Executive summary',
    visibilite: 'Google vs AI visibility',
    constats: 'Top findings',
    aucunConstat: 'No critical issue found.',
    scorecard: '7-pillar scorecard',
    pilier: 'Pillar',
    scoreCible: 'Score / target',
    statut: 'Status',
    quickWinsTitre: 'Priority quick wins',
    quickWinsTexte: 'Quick wins',
    effort: 'Effort:',
    deuxPoints: ':',
    action: 'Action:',
    pdfJoint: 'The full report is attached to this email.',
    pdfAVenir: 'The detailed report will be sent to you shortly.',
    pdfJointTexte: 'The full report is attached to this email.',
    pdfAVenirTexte: 'The detailed report will be sent to you shortly.',
    sousTitre:
      '7-pillar strategic summary + quick wins ranked by impact/effort',
    preheader: (site: string) =>
      `Asili Design Growth audit for ${site} — open to see your scorecard.`,
    niveau: (niveau: ReportSeverity) =>
      ({ high: 'High', medium: 'Medium', low: 'Low' })[niveau],
    nomDuPilier: (pilier: string) => libelleOuCle(PILIERS_EN_ANGLAIS, pilier),
  },
} as const satisfies Record<AuditLocale, unknown>;

@Injectable()
export class AuditClientReportMailer extends MailerDAudit {
  async sendClientReport(saisie: ClientReportMailInput): Promise<void> {
    if (!saisie.to || saisie.to.trim().length === 0) return;
    const input = {
      ...saisie,
      websiteName: adresseDuSite(saisie.websiteName).hostname,
    };

    await this.envoyer({
      to: input.to,
      replyTo: destinataireDesRapportsDAudit(),
      subject: TEXTES[input.locale].objet(input.websiteName),
      text: this.buildClientReportText(input),
      html: this.buildClientReportHtml(input),
      attachments: input.pdfBuffer
        ? [
            pieceJointePdf(
              `growth-audit-${slugify(input.websiteName)}.pdf`,
              input.pdfBuffer,
            ),
          ]
        : undefined,
    });
  }

  private buildClientReportHtml(input: ClientReportMailInput): EscapedHtml {
    const report = input.clientReport;
    const textes = TEXTES[input.locale];

    const topFindingsHtml = report.topFindings.map(
      (finding) => safeHtml`
          <li style="margin-bottom:8px;">
            <strong>[${escapeHtml(textes.niveau(finding.severity))}] ${escapeHtml(finding.title)}</strong><br/>
            <span>${escapeHtml(finding.impact)}</span>
          </li>`,
    );

    const pillarsHtml = rapportClientServi(
      report,
      input.locale,
    ).pillarScorecard.map(
      (pillar) => safeHtml`
          <tr>
            <td style="padding:6px 8px; border:1px solid #e5e7eb;">${escapeHtml(textes.nomDuPilier(pillar.pillar))}</td>
            <td style="padding:6px 8px; border:1px solid #e5e7eb; text-align:right;">${pillar.score}/${pillar.target}</td>
            <td style="padding:6px 8px; border:1px solid #e5e7eb;">${escapeHtml(pillar.statusLabel)}</td>
          </tr>`,
    );

    const quickWinsHtml = report.quickWins.map(
      (qw) => safeHtml`
          <li style="margin-bottom:8px;">
            <strong>${escapeHtml(qw.title)}</strong> — <em>${escapeHtml(textes.effort)} ${escapeHtml(textes.niveau(qw.effort))}</em><br/>
            <span>${escapeHtml(qw.businessImpact)}</span>
          </li>`,
    );

    const bodyHtml = safeHtml`
      <p style="margin-top:0;">${escapeHtml(textes.salutation(input.firstName))}</p>
      <p>${escapeHtml(textes.intro)}</p>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">${escapeHtml(textes.synthese)}</h2>
      <p style="white-space:pre-line;color:#374151;">${escapeHtml(report.executiveSummary)}</p>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">${escapeHtml(textes.visibilite)}</h2>
      ${listeDeVisibilite(report.googleVsAiMatrix, input.locale)}

      <h2 style="margin:24px 0 8px 0;font-size:16px;">${escapeHtml(textes.constats)}</h2>
      <ul style="padding-left:20px;color:#374151;">
        ${topFindingsHtml.length > 0 ? topFindingsHtml : safeHtml`<li>${escapeHtml(textes.aucunConstat)}</li>`}
      </ul>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">${escapeHtml(textes.scorecard)}</h2>
      <table class="divider" style="width:100%;border-collapse:collapse;font-size:13px;color:#374151;">
        <thead>
          <tr>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">${escapeHtml(textes.pilier)}</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">${escapeHtml(textes.scoreCible)}</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">${escapeHtml(textes.statut)}</th>
          </tr>
        </thead>
        <tbody>${pillarsHtml}</tbody>
      </table>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">${escapeHtml(textes.quickWinsTitre)}</h2>
      <ul style="padding-left:20px;color:#374151;">
        ${quickWinsHtml}
      </ul>

      <div style="margin-top:28px;padding:20px;background:#111;color:#fff;border-radius:10px;">
        <strong style="font-size:16px;">${escapeHtml(report.cta.title)}</strong>
        <p style="margin:6px 0 14px 0;color:#d1d5db;">${escapeHtml(report.cta.description)}</p>
        <a
          href="${escapeUrl(this.resolveBookingUrl(input.locale))}"
          target="_blank"
          rel="noopener noreferrer"
          style="display:inline-block;padding:12px 22px;background:#ffffff;color:#111;border-radius:8px;text-decoration:none;font-weight:600;"
        >${escapeHtml(report.cta.actionLabel)}</a>
      </div>

      <p class="text-muted" style="font-size:12px;color:#6b7280;margin-top:24px;">
        ${escapeHtml(input.pdfBuffer ? textes.pdfJoint : textes.pdfAVenir)}
      </p>
    `;

    return buildMailLayout({
      heroTitle: textes.objet(input.websiteName),
      heroSubtitle: textes.sousTitre,
      preheader: textes.preheader(input.websiteName),
      bodyHtml,
      showUnsubscribe: true,
      locale: input.locale,
    });
  }

  private resolveBookingUrl(locale: AuditLocale): string {
    return envString('AUDIT_BOOKING_URL') ?? pageDuSite(locale, 'contact');
  }

  private buildClientReportText(input: ClientReportMailInput): string {
    const report = input.clientReport;
    const textes = TEXTES[input.locale];
    const lines: string[] = [];
    lines.push(textes.titreTexte(input.websiteName));
    lines.push('');
    lines.push(textes.salutation(input.firstName));
    lines.push('');
    lines.push(`${textes.synthese}${textes.deuxPoints}`);
    lines.push(report.executiveSummary);
    lines.push('');
    lines.push(...lignesDeVisibilite(report.googleVsAiMatrix, input.locale));
    lines.push('');
    lines.push(`${textes.constats}${textes.deuxPoints}`);
    for (const finding of report.topFindings) {
      lines.push(
        `- [${textes.niveau(finding.severity)}] ${finding.title} — ${finding.impact}`,
      );
    }
    lines.push('');
    lines.push(`${textes.scorecard}${textes.deuxPoints}`);
    for (const pillar of rapportClientServi(report, input.locale)
      .pillarScorecard) {
      lines.push(
        `- ${textes.nomDuPilier(pillar.pillar)}: ${pillar.score}/${pillar.target} (${pillar.statusLabel})`,
      );
    }
    lines.push('');
    lines.push(`${textes.quickWinsTexte}${textes.deuxPoints}`);
    for (const qw of report.quickWins) {
      lines.push(
        `- ${qw.title} (${textes.effort} ${textes.niveau(qw.effort)}) — ${qw.businessImpact}`,
      );
    }
    lines.push('');
    lines.push(`${report.cta.title} — ${report.cta.description}`);
    lines.push(
      `${textes.action} ${report.cta.actionLabel} → ${this.resolveBookingUrl(input.locale)}`,
    );
    lines.push('');
    lines.push(input.pdfBuffer ? textes.pdfJointTexte : textes.pdfAVenirTexte);
    return lines.join('\n');
  }
}
