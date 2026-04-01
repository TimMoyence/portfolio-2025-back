import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import type {
  IPasswordResetNotifier,
  PasswordResetNotificationPayload,
} from '../domain/IPasswordResetNotifier';

/** Service SMTP pour notifier les utilisateurs lors d'une reinitialisation de mot de passe. */
@Injectable()
export class PasswordResetMailerService implements IPasswordResetNotifier {
  private readonly logger = new Logger(PasswordResetMailerService.name);
  private readonly transporter?: Transporter;
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
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: { user, pass },
      }) as Transporter;
      return;
    }

    this.logger.warn(
      'Password reset mailer disabled: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS not fully configured',
    );
  }

  async sendPasswordResetEmail(
    payload: PasswordResetNotificationPayload,
  ): Promise<void> {
    if (!this.transporter) {
      return;
    }

    const fullName = `${payload.firstName} ${payload.lastName}`.trim();
    const subject = 'Reinitialisation de votre mot de passe';

    await this.transporter.sendMail({
      from: this.from,
      to: payload.email,
      subject,
      text: [
        `Bonjour ${fullName},`,
        '',
        'Nous avons recu une demande de reinitialisation de mot de passe.',
        `Ce lien est valide ${payload.expiresInMinutes} minutes :`,
        payload.resetUrl,
        '',
        "Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer cet email.",
      ].join('\n'),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#111;">Reinitialisation du mot de passe</h2>
            <p>Bonjour ${this.escapeHtml(fullName)},</p>
            <p>
              Nous avons recu une demande de reinitialisation de mot de passe.
              Ce lien est valide <strong>${payload.expiresInMinutes} minutes</strong>.
            </p>
            <p style="margin:24px 0;">
              <a href="${this.escapeHtml(payload.resetUrl)}" style="display:inline-block; background:#0f172a; color:#fff; text-decoration:none; padding:12px 18px; border-radius:8px;">
                Reinitialiser mon mot de passe
              </a>
            </p>
            <p style="word-break:break-all; color:#334155;">${this.escapeHtml(payload.resetUrl)}</p>
            <p style="font-size:12px; color:#64748b; margin-top:24px;">
              Si vous n'etes pas a l'origine de cette demande, ignorez cet email.
            </p>
          </div>
        </div>
      `,
    });
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
