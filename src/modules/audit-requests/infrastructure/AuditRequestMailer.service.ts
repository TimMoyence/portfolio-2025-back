import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AuditRequest } from '../domain/AuditRequest';

export interface AuditReportNotificationPayload {
  auditId: string;
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
  contactValue: string;
  summaryText: string;
  fullReport: Record<string, unknown>;
}

@Injectable()
export class AuditRequestMailerService {
  private readonly logger = new Logger(AuditRequestMailerService.name);
  private readonly transporter?: Transporter;
  private readonly to = process.env.CONTACT_NOTIFICATION_TO;
  private readonly reportTo =
    process.env.AUDIT_REPORT_TO ?? process.env.CONTACT_NOTIFICATION_TO;
  private readonly from = process.env.SMTP_FROM;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? Number(process.env.SMTP_PORT)
      : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      }) as Transporter;
    } else {
      this.logger.warn(
        'Audit request mailer disabled: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS not fully configured',
      );
    }
  }

  async sendAuditNotification(request: AuditRequest): Promise<void> {
    if (!this.transporter || !this.to) return;

    const { websiteName, contactMethod, contactValue } = request;

    await this.transporter.sendMail({
      from: this.from,
      to: this.to,
      subject: "🔍 Nouvelle demande d'audit SEO",
      text: `
NOUVELLE DEMANDE D'AUDIT
-------------------------

Site / activité : ${websiteName}
Contact        : ${contactMethod} — ${contactValue}
      `.trim(),
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#333;">🔍 Nouvelle demande d'audit SEO</h2>

            <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
              <tr>
                <td style="padding:6px 0; font-weight:bold; width:140px;">Site / activité</td>
                <td style="padding:6px 0;">${websiteName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:bold;">Contact</td>
                <td style="padding:6px 0;">${contactMethod} — ${contactValue}</td>
              </tr>
            </table>

            <p style="font-size:12px; color:#666; margin:0;">
              Demande envoyée depuis la page d'audit gratuit du site.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendAuditReportNotification(
    payload: AuditReportNotificationPayload,
  ): Promise<void> {
    if (!this.transporter || !this.reportTo) return;

    const { auditId, websiteName, contactMethod, contactValue, summaryText } =
      payload;
    const serializedReport = JSON.stringify(payload.fullReport, null, 2);

    await this.transporter.sendMail({
      from: this.from,
      to: this.reportTo,
      subject: `📊 Rapport d'audit terminé — ${websiteName}`,
      text: `
RAPPORT D'AUDIT TERMINE
-----------------------

Audit ID      : ${auditId}
Site          : ${websiteName}
Contact       : ${contactMethod} — ${contactValue}

Resume:
${summaryText}

Rapport complet (JSON):
${serializedReport}
      `.trim(),
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:720px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#333;">📊 Rapport d'audit terminé</h2>
            <p style="margin-bottom:8px;"><strong>Audit ID:</strong> ${auditId}</p>
            <p style="margin-bottom:8px;"><strong>Site:</strong> ${websiteName}</p>
            <p style="margin-bottom:16px;"><strong>Contact:</strong> ${contactMethod} — ${contactValue}</p>

            <h3 style="margin-bottom:8px;">Résumé utilisateur</h3>
            <p style="white-space:pre-line; color:#333;">${summaryText}</p>

            <h3 style="margin:16px 0 8px;">Rapport complet (JSON)</h3>
            <pre style="max-height:360px; overflow:auto; background:#111; color:#eee; padding:12px; border-radius:6px;">${serializedReport}</pre>
          </div>
        </div>
      `,
    });
  }
}
