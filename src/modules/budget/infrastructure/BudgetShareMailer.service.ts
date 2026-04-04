import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type {
  BudgetShareNotificationPayload,
  IBudgetShareNotifier,
} from '../domain/IBudgetShareNotifier';

/** Service d'envoi d'email pour les notifications de partage de budget. */
@Injectable()
export class BudgetShareMailerService implements IBudgetShareNotifier {
  private readonly logger = new Logger(BudgetShareMailerService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? Number(process.env.SMTP_PORT)
      : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.from = process.env.SMTP_FROM ?? "'Portfolio' <no-reply@example.com>";

    if (host && port && user && pass) {
      this.transporter = createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: { user, pass },
      }) as Transporter;
      return;
    }

    this.transporter = null;
    this.logger.warn(
      'Budget share mailer disabled: SMTP configuration incomplete',
    );
  }

  async sendBudgetShareNotification(
    payload: BudgetShareNotificationPayload,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `Budget share email skipped (no SMTP): ${payload.targetEmail}`,
      );
      return;
    }

    const ownerName = this.escapeHtml(
      `${payload.ownerFirstName} ${payload.ownerLastName}`,
    );
    const targetName = this.escapeHtml(payload.targetFirstName);
    const groupName = this.escapeHtml(payload.groupName);
    const budgetUrl = payload.budgetUrl;

    await this.transporter.sendMail({
      from: this.from,
      to: payload.targetEmail,
      subject: `${this.escapeHtml(payload.ownerFirstName)} vous invite sur le budget "${this.escapeHtml(payload.groupName)}"`,
      text: [
        `Bonjour ${this.escapeHtml(payload.targetFirstName)},`,
        '',
        `${this.escapeHtml(payload.ownerFirstName)} ${this.escapeHtml(payload.ownerLastName)} vous a invite a rejoindre le budget partage "${this.escapeHtml(payload.groupName)}".`,
        '',
        `Connectez-vous pour y acceder : ${budgetUrl}`,
        '',
        'A bientot,',
        "L'equipe Portfolio",
      ].join('\n'),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;padding:24px;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;">
            <h2 style="margin-top:0;color:#111;">Invitation budget partage</h2>
            <p>Bonjour ${targetName},</p>
            <p><strong>${ownerName}</strong> vous a invite a rejoindre le budget partage <strong>${groupName}</strong>.</p>
            <p>Vous pouvez desormais consulter les depenses, ajouter des transactions et suivre le budget commun.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${budgetUrl}" style="display:inline-block;background:#0f7b65;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
                Acceder au budget
              </a>
            </div>
            <p style="color:#888;font-size:12px;">Si vous n'avez pas de compte, creez-en un avec cette adresse email pour acceder au budget.</p>
          </div>
        </div>
      `,
    });

    this.logger.log(`Budget share email sent to ${payload.targetEmail}`);
  }

  /** Echappe les caracteres HTML speciaux pour eviter les injections. */
  private escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
