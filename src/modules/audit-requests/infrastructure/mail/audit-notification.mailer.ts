import { Injectable } from '@nestjs/common';
import { destinataireDesNotifications } from '../../../../config/adresses-de-courriel';
import { AuditRequest } from '../../domain/AuditRequest';
import { buildMailLayout } from './mail-layout.util';
import { MailerDAudit } from './mailer-d-audit';
import { escapeHtml, safeHtml } from './mail-rendering.util';

@Injectable()
export class AuditNotificationMailer extends MailerDAudit {
  async sendAuditNotification(request: AuditRequest): Promise<void> {
    const to = destinataireDesNotifications();
    if (!to) return;

    const { websiteName, contactMethod, contactValue } = request;

    await this.envoyer({
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
    const bodyHtml = safeHtml`
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
