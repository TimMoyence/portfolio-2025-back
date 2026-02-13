import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AuditRequest } from '../domain/AuditRequest';

@Injectable()
export class AuditRequestMailerService {
  private readonly logger = new Logger(AuditRequestMailerService.name);
  private readonly transporter?: Transporter;
  private readonly to = process.env.CONTACT_NOTIFICATION_TO;
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
}
