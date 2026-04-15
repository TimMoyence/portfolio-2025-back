import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ExpertReportMailInput } from '../../domain/IAuditNotifier.port';
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
        ? `<p style="margin:0 0 8px; padding:12px; background:#fff4e5; border-left:4px solid #f59e0b;"><strong>Contact TELEPHONE — appel requis :</strong> ${escapeHtml(input.clientContact.value)}</p>`
        : `<p style="margin:0 0 8px;"><strong>Contact EMAIL :</strong> ${escapeHtml(input.clientContact.value)}</p>`;

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
      <ul style="padding-left:20px; color:#333;">
        <li>Google : ${client.googleVsAiMatrix.googleVisibility.score}/100 — ${escapeHtml(client.googleVsAiMatrix.googleVisibility.summary)}</li>
        <li>IA : ${client.googleVsAiMatrix.aiVisibility.score}/100 — ${escapeHtml(client.googleVsAiMatrix.aiVisibility.summary)}</li>
      </ul>`;

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
        <div style="max-width:760px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
          <h2 style="margin-top:0;">[Audit Expert] ${escapeHtml(input.websiteName)}</h2>
          <p style="margin:0 0 8px;"><strong>Audit ID :</strong> ${escapeHtml(input.auditId)}</p>
          ${contactHtml}

          <h3 style="margin-top:20px;">Executive summary expert</h3>
          <p style="white-space:pre-line; color:#333;">${escapeHtml(expert.executiveSummary)}</p>

          <h3 style="margin-top:20px;">Synthese client (Google vs IA)</h3>
          ${clientMatrixHtml}

          <h3 style="margin-top:20px;">Draft mail client (a copier/coller)</h3>
          <div style="padding:16px; background:#f9fafb; border:1px dashed #cbd5e1; border-radius:6px;">
            <p style="margin:0 0 8px;"><strong>Subject :</strong> ${escapeHtml(expert.clientEmailDraft.subject)}</p>
            <pre style="margin:0; white-space:pre-wrap; font-family:inherit; color:#111;">${escapeHtml(expert.clientEmailDraft.body)}</pre>
          </div>

          <h3 style="margin-top:20px;">Internal notes</h3>
          <p style="white-space:pre-line; color:#333;">${escapeHtml(expert.internalNotes)}</p>

          <h3 style="margin-top:20px;">Cross-page findings (top 5)</h3>
          <ul style="padding-left:20px; color:#333;">
            ${crossFindingsHtml || '<li>Aucun.</li>'}
          </ul>

          <h3 style="margin-top:20px;">Priority backlog</h3>
          <ul style="padding-left:20px; color:#333;">
            ${backlogHtml || '<li>Aucun.</li>'}
          </ul>

          <p style="font-size:12px; color:#666; margin-top:24px;">PDF complet en piece jointe.</p>
        </div>
      </div>
    `;
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
