import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuditRequest } from '../../domain/AuditRequest';
import { escapeHtml } from './mail-rendering.util';
import { SMTP_TRANSPORTER } from './smtp-transporter.provider';
import type { SmtpTransporter } from './smtp-transporter.provider';

/**
 * Mailer dedie a l'audience "Admin" : envoie un email de notification lorsque
 * une nouvelle demande d'audit SEO est soumise depuis le formulaire public.
 * Lit `CONTACT_NOTIFICATION_TO` et `SMTP_FROM` directement depuis
 * l'environnement. Se comporte en no-op silencieux si le transporter SMTP
 * n'est pas configure ou si `CONTACT_NOTIFICATION_TO` est absent.
 */
@Injectable()
export class AuditNotificationMailer {
  private readonly logger = new Logger(AuditNotificationMailer.name);

  constructor(
    @Inject(SMTP_TRANSPORTER)
    private readonly transporter: SmtpTransporter,
  ) {}

  /**
   * Envoie la notification admin pour une nouvelle demande d'audit. Ne leve
   * jamais : si le transporter est absent ou si `CONTACT_NOTIFICATION_TO`
   * n'est pas defini, la methode est un no-op.
   */
  async sendAuditNotification(request: AuditRequest): Promise<void> {
    const to = process.env.CONTACT_NOTIFICATION_TO;
    if (!this.transporter || !to) return;

    const { websiteName, contactMethod, contactValue } = request;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "🔍 Nouvelle demande d'audit SEO",
      text: `
NOUVELLE DEMANDE D'AUDIT
-------------------------

Site / activité : ${websiteName}
Contact        : ${contactMethod} — ${contactValue}
      `.trim(),
      html: this.buildNotificationHtml(
        websiteName,
        contactMethod,
        contactValue,
      ),
    });
  }

  private buildNotificationHtml(
    websiteName: string,
    contactMethod: string,
    contactValue: string,
  ): string {
    return `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#333;">🔍 Nouvelle demande d'audit SEO</h2>

            <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
              <tr>
                <td style="padding:6px 0; font-weight:bold; width:140px;">Site / activité</td>
                <td style="padding:6px 0;">${escapeHtml(websiteName)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:bold;">Contact</td>
                <td style="padding:6px 0;">${escapeHtml(contactMethod)} — ${escapeHtml(contactValue)}</td>
              </tr>
            </table>

            <p style="font-size:12px; color:#666; margin:0;">
              Demande envoyée depuis la page d'audit gratuit du site.
            </p>
          </div>
        </div>
      `;
  }
}
