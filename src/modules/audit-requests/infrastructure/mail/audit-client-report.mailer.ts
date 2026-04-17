import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ClientReportMailInput } from '../../domain/IAuditNotifier.port';
import { pillarLabel } from '../automation/shared/pillar-labels.util';
import { buildMailLayout } from './mail-layout.util';
import { escapeHtml, slugify } from './mail-rendering.util';
import { SMTP_TRANSPORTER } from './smtp-transporter.provider';
import type { SmtpTransporter } from './smtp-transporter.provider';

/**
 * Mailer dedie a l'audience "Client" : envoie au decideur final la synthese
 * strategique (`ClientReportSynthesis`) et attache le PDF si disponible.
 * No-op silencieux si le transporter SMTP est absent ou si l'email
 * destinataire est vide.
 */
@Injectable()
export class AuditClientReportMailer {
  private readonly logger = new Logger(AuditClientReportMailer.name);

  constructor(
    @Inject(SMTP_TRANSPORTER)
    private readonly transporter: SmtpTransporter,
  ) {}

  /**
   * Envoie au client final la synthese strategique. Ne leve jamais : si le
   * transporter est absent ou si l'email est vide, la methode est un no-op.
   */
  async sendClientReport(input: ClientReportMailInput): Promise<void> {
    if (!this.transporter) return;
    if (!input.to || input.to.trim().length === 0) return;

    const subject = `Votre audit Growth — ${input.websiteName}`;
    const html = this.buildClientReportHtml(input);
    const text = this.buildClientReportText(input);
    const replyTo =
      process.env.AUDIT_REPORT_TO ?? process.env.CONTACT_NOTIFICATION_TO;

    const attachments = input.pdfBuffer
      ? [
          {
            filename: `growth-audit-${slugify(input.websiteName)}.pdf`,
            content: input.pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: input.to,
      replyTo,
      subject,
      text,
      html,
      attachments,
    });
  }

  private buildClientReportHtml(input: ClientReportMailInput): string {
    const report = input.clientReport;
    const greeting = input.firstName
      ? `Bonjour ${escapeHtml(input.firstName)},`
      : 'Bonjour,';

    const topFindingsHtml = report.topFindings
      .map(
        (finding) => `
          <li style="margin-bottom:8px;">
            <strong>[${escapeHtml(finding.severity.toUpperCase())}] ${escapeHtml(finding.title)}</strong><br/>
            <span>${escapeHtml(finding.impact)}</span>
          </li>`,
      )
      .join('');

    const pillarsHtml = report.pillarScorecard
      .map(
        (pillar) => `
          <tr>
            <td style="padding:6px 8px; border:1px solid #e5e7eb;">${escapeHtml(pillarLabel(pillar.pillar))}</td>
            <td style="padding:6px 8px; border:1px solid #e5e7eb; text-align:right;">${pillar.score}/${pillar.target}</td>
            <td style="padding:6px 8px; border:1px solid #e5e7eb;">${escapeHtml(pillar.status)}</td>
          </tr>`,
      )
      .join('');

    const quickWinsHtml = report.quickWins
      .map(
        (qw) => `
          <li style="margin-bottom:8px;">
            <strong>${escapeHtml(qw.title)}</strong> — <em>${escapeHtml(qw.effort)}</em><br/>
            <span>${escapeHtml(qw.businessImpact)}</span>
          </li>`,
      )
      .join('');

    const bodyHtml = `
      <p style="margin-top:0;">${greeting}</p>
      <p>Voici la synthèse stratégique de votre audit.</p>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Executive summary</h2>
      <p style="white-space:pre-line;color:#374151;">${escapeHtml(report.executiveSummary)}</p>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Visibilité Google vs IA</h2>
      <p style="color:#374151;">
        <strong>Google :</strong> ${report.googleVsAiMatrix.googleVisibility.score}/100 — ${escapeHtml(report.googleVsAiMatrix.googleVisibility.summary)}<br/>
        <strong>IA :</strong> ${report.googleVsAiMatrix.aiVisibility.score}/100 — ${escapeHtml(report.googleVsAiMatrix.aiVisibility.summary)}
      </p>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Top findings</h2>
      <ul style="padding-left:20px;color:#374151;">
        ${topFindingsHtml || '<li>Aucun point critique détecté.</li>'}
      </ul>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Scorecard 7 piliers</h2>
      <table class="divider" style="width:100%;border-collapse:collapse;font-size:13px;color:#374151;">
        <thead>
          <tr>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Pilier</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;">Score / cible</th>
            <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left;">Statut</th>
          </tr>
        </thead>
        <tbody>${pillarsHtml}</tbody>
      </table>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Quick wins prioritaires</h2>
      <ul style="padding-left:20px;color:#374151;">
        ${quickWinsHtml}
      </ul>

      <div style="margin-top:28px;padding:20px;background:#111;color:#fff;border-radius:10px;">
        <strong style="font-size:16px;">${escapeHtml(report.cta.title)}</strong>
        <p style="margin:6px 0 14px 0;color:#d1d5db;">${escapeHtml(report.cta.description)}</p>
        <a
          href="${escapeHtml(this.resolveBookingUrl(input))}"
          target="_blank"
          rel="noopener noreferrer"
          style="display:inline-block;padding:12px 22px;background:#ffffff;color:#111;border-radius:8px;text-decoration:none;font-weight:600;"
        >${escapeHtml(report.cta.actionLabel)}</a>
      </div>

      <p class="text-muted" style="font-size:12px;color:#6b7280;margin-top:24px;">
        ${
          input.pdfBuffer
            ? 'Le rapport complet est joint à cet email.'
            : 'Le rapport détaillé vous sera envoyé dans un second temps.'
        }
      </p>
    `;

    return buildMailLayout({
      heroTitle: `Votre audit Growth — ${input.websiteName}`,
      heroSubtitle:
        'Synthèse stratégique 7 piliers + quick wins priorisés par impact/effort',
      preheader: `Audit Growth Asili Design pour ${input.websiteName} — ouvrez pour voir votre scorecard.`,
      bodyHtml,
      showUnsubscribe: true,
    });
  }

  /**
   * Retourne l'URL cible du CTA client. Priorise `input.bookingUrl` si
   * fourni par l'orchestrateur, sinon fallback sur `AUDIT_BOOKING_URL`
   * env, puis sur la page `/contact` d'Asili Design. Jamais vide pour
   * garantir que le CTA est toujours cliquable (P0.5).
   */
  private resolveBookingUrl(input: ClientReportMailInput): string {
    const explicit = input.bookingUrl?.trim();
    if (explicit) return explicit;
    const fromEnv = process.env.AUDIT_BOOKING_URL?.trim();
    if (fromEnv) return fromEnv;
    return 'https://asilidesign.fr/fr/contact';
  }

  private buildClientReportText(input: ClientReportMailInput): string {
    const report = input.clientReport;
    const lines: string[] = [];
    lines.push(`VOTRE AUDIT GROWTH — ${input.websiteName}`);
    lines.push('');
    lines.push(input.firstName ? `Bonjour ${input.firstName},` : 'Bonjour,');
    lines.push('');
    lines.push('Executive summary :');
    lines.push(report.executiveSummary);
    lines.push('');
    lines.push(
      `Google : ${report.googleVsAiMatrix.googleVisibility.score}/100 — ${report.googleVsAiMatrix.googleVisibility.summary}`,
    );
    lines.push(
      `IA : ${report.googleVsAiMatrix.aiVisibility.score}/100 — ${report.googleVsAiMatrix.aiVisibility.summary}`,
    );
    lines.push('');
    lines.push('Top findings :');
    for (const finding of report.topFindings) {
      lines.push(
        `- [${finding.severity.toUpperCase()}] ${finding.title} — ${finding.impact}`,
      );
    }
    lines.push('');
    lines.push('Scorecard 7 piliers :');
    for (const pillar of report.pillarScorecard) {
      lines.push(
        `- ${pillarLabel(pillar.pillar)}: ${pillar.score}/${pillar.target} (${pillar.status})`,
      );
    }
    lines.push('');
    lines.push('Quick wins :');
    for (const qw of report.quickWins) {
      lines.push(`- ${qw.title} (${qw.effort}) — ${qw.businessImpact}`);
    }
    lines.push('');
    lines.push(`${report.cta.title} — ${report.cta.description}`);
    lines.push(
      `Action : ${report.cta.actionLabel} → ${this.resolveBookingUrl(input)}`,
    );
    lines.push('');
    lines.push(
      input.pdfBuffer
        ? 'Le rapport complet est joint a cet email.'
        : 'Le rapport detaille vous sera envoye dans un second temps.',
    );
    return lines.join('\n');
  }
}
