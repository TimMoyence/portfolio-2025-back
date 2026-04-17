import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ExpertReportMailInput } from '../../domain/IAuditNotifier.port';
import { buildMailLayout } from './mail-layout.util';
import { escapeHtml, slugify } from './mail-rendering.util';
import { SMTP_TRANSPORTER } from './smtp-transporter.provider';
import type { SmtpTransporter } from './smtp-transporter.provider';

/**
 * Mailer dedie a l'audience "Expert" (Tim) : envoie la synthese expert avec
 * le draft mail client, les constats transverses, le backlog priorise et le
 * PDF obligatoire. No-op silencieux si le transporter SMTP est absent ou si
 * aucune adresse destinataire n'est configuree.
 */
@Injectable()
export class AuditExpertReportMailer {
  private readonly logger = new Logger(AuditExpertReportMailer.name);

  constructor(
    @Inject(SMTP_TRANSPORTER)
    private readonly transporter: SmtpTransporter,
  ) {}

  /**
   * Envoie a Tim la synthese expert avec le draft de mail client, les
   * constats transverses, le backlog priorise et le PDF obligatoire.
   */
  async sendExpertReport(input: ExpertReportMailInput): Promise<void> {
    if (!this.transporter) return;
    const to =
      process.env.AUDIT_REPORT_TO ?? process.env.CONTACT_NOTIFICATION_TO;
    if (!to) return;

    const subject = `[Audit Expert] ${input.websiteName}`;
    const html = this.buildExpertReportHtml(input);
    const text = this.buildExpertReportText(input);

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `growth-audit-expert-${slugify(input.websiteName)}.pdf`,
          content: input.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private buildExpertReportHtml(input: ExpertReportMailInput): string {
    const expert = input.expertReport;
    const client = input.clientReport;
    const contactHtml =
      input.clientContact.method === 'PHONE'
        ? `<p style="margin:0 0 12px;padding:12px;background:#fff4e5;border-left:4px solid #f59e0b;color:#7c2d12;"><strong>Contact TELEPHONE — appel requis :</strong> ${escapeHtml(input.clientContact.value)}</p>`
        : `<p style="margin:0 0 12px;color:#374151;"><strong>Contact EMAIL :</strong> ${escapeHtml(input.clientContact.value)}</p>`;

    const crossFindingsHtml = expert.crossPageFindings
      .slice(0, 5)
      .map(
        (finding) => `
          <li style="margin-bottom:10px;">
            <strong>[${escapeHtml(finding.severity.toUpperCase())}] ${escapeHtml(finding.title)}</strong><br/>
            <span><em>Root cause :</em> ${escapeHtml(finding.rootCause)}</span><br/>
            <span><em>Remediation :</em> ${escapeHtml(finding.remediation)}</span><br/>
            <span><em>Affected URLs :</em> ${escapeHtml(finding.affectedUrls.join(', ') || '—')}</span>
          </li>`,
      )
      .join('');

    const backlogHtml = expert.priorityBacklog
      .map(
        (item) => `
          <li style="margin-bottom:10px;">
            <strong>${escapeHtml(item.title)}</strong> — impact ${escapeHtml(item.impact)} / effort ${escapeHtml(item.effort)}<br/>
            <em>Acceptance :</em> ${escapeHtml(item.acceptanceCriteria.join(' | ') || '—')}
          </li>`,
      )
      .join('');

    const clientMatrixHtml = `
      <ul style="padding-left:20px;color:#374151;">
        <li>Google : ${client.googleVsAiMatrix.googleVisibility.score}/100 — ${escapeHtml(client.googleVsAiMatrix.googleVisibility.summary)}</li>
        <li>IA : ${client.googleVsAiMatrix.aiVisibility.score}/100 — ${escapeHtml(client.googleVsAiMatrix.aiVisibility.summary)}</li>
      </ul>`;

    const bodyHtml = `
      <p style="margin:0 0 12px;"><strong>Audit ID :</strong> <code style="font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px;">${escapeHtml(input.auditId)}</code></p>
      ${contactHtml}

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Executive summary expert</h2>
      <p style="white-space:pre-line;color:#374151;">${escapeHtml(expert.executiveSummary)}</p>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Synthese client (Google vs IA)</h2>
      ${clientMatrixHtml}

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Draft mail client (a copier/coller)</h2>
      <div style="padding:16px;background:#f9fafb;border:1px dashed #cbd5e1;border-radius:8px;">
        <p style="margin:0 0 8px;color:#374151;"><strong>Subject :</strong> ${escapeHtml(expert.clientEmailDraft.subject)}</p>
        <pre style="margin:0;white-space:pre-wrap;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#111;font-size:14px;">${escapeHtml(expert.clientEmailDraft.body)}</pre>
      </div>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Internal notes</h2>
      <p style="white-space:pre-line;color:#374151;">${escapeHtml(expert.internalNotes)}</p>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Cross-page findings (top 5)</h2>
      <ul style="padding-left:20px;color:#374151;">
        ${crossFindingsHtml || '<li>Aucun.</li>'}
      </ul>

      <h2 style="margin:24px 0 8px 0;font-size:16px;">Priority backlog</h2>
      <ul style="padding-left:20px;color:#374151;">
        ${backlogHtml || '<li>Aucun.</li>'}
      </ul>

      <p class="text-muted" style="font-size:12px;color:#6b7280;margin-top:24px;">
        PDF complet en piece jointe.
      </p>
    `;

    return buildMailLayout({
      heroTitle: `[Audit Expert] ${input.websiteName}`,
      heroSubtitle:
        'Rapport technique complet + draft mail client + backlog priorisé',
      preheader: `Audit expert livré pour ${input.websiteName} — ${expert.crossPageFindings.length} findings, ${expert.priorityBacklog.length} backlog items`,
      bodyHtml,
      showUnsubscribe: false,
    });
  }

  private buildExpertReportText(input: ExpertReportMailInput): string {
    const expert = input.expertReport;
    const client = input.clientReport;
    const lines: string[] = [];
    lines.push(`[AUDIT EXPERT] ${input.websiteName}`);
    lines.push(`Audit ID : ${input.auditId}`);
    lines.push(
      input.clientContact.method === 'PHONE'
        ? `Contact TELEPHONE — appel requis : ${input.clientContact.value}`
        : `Contact EMAIL : ${input.clientContact.value}`,
    );
    lines.push('');
    lines.push('Executive summary expert :');
    lines.push(expert.executiveSummary);
    lines.push('');
    lines.push('Synthese client (Google vs IA) :');
    lines.push(
      `- Google : ${client.googleVsAiMatrix.googleVisibility.score}/100 — ${client.googleVsAiMatrix.googleVisibility.summary}`,
    );
    lines.push(
      `- IA : ${client.googleVsAiMatrix.aiVisibility.score}/100 — ${client.googleVsAiMatrix.aiVisibility.summary}`,
    );
    lines.push('');
    lines.push('--- Draft mail client (a copier/coller) ---');
    lines.push(`Subject : ${expert.clientEmailDraft.subject}`);
    lines.push('');
    lines.push(expert.clientEmailDraft.body);
    lines.push('--- fin draft ---');
    lines.push('');
    lines.push('Internal notes :');
    lines.push(expert.internalNotes);
    lines.push('');
    lines.push('Cross-page findings (top 5) :');
    for (const finding of expert.crossPageFindings.slice(0, 5)) {
      lines.push(
        `- [${finding.severity.toUpperCase()}] ${finding.title} — root cause : ${finding.rootCause} — remediation : ${finding.remediation}`,
      );
    }
    lines.push('');
    lines.push('Priority backlog :');
    for (const item of expert.priorityBacklog) {
      lines.push(
        `- ${item.title} (impact ${item.impact} / effort ${item.effort})`,
      );
    }
    lines.push('');
    lines.push('PDF complet en piece jointe.');
    return lines.join('\n');
  }
}
