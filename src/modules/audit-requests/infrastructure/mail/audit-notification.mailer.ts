import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuditRequest } from '../../domain/AuditRequest';
import { buildMailLayout } from './mail-layout.util';
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
    const bodyHtml = `
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        <tr>
          <td style="padding:8px 0;font-weight:600;width:140px;color:#374151;">Site / activité</td>
          <td style="padding:8px 0;color:#111;">${escapeHtml(websiteName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:600;color:#374151;">Contact</td>
          <td style="padding:8px 0;color:#111;">${escapeHtml(contactMethod)} — ${escapeHtml(contactValue)}</td>
        </tr>
      </table>
      <p class="text-muted" style="font-size:13px;color:#6b7280;margin:0;">
        Demande envoyée depuis la page d'audit gratuit du site.
      </p>
    `;

    return buildMailLayout({
      heroTitle: "Nouvelle demande d'audit SEO",
      heroSubtitle: 'Notification interne — audit soumis via /growth-audit',
      preheader: `Nouvelle demande pour ${websiteName} (${contactMethod})`,
      bodyHtml,
      showUnsubscribe: false,
    });
  }
}
