import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import type {
  IEmailVerificationNotifier,
  EmailVerificationNotificationPayload,
} from '../domain/IEmailVerificationNotifier';

/** Service SMTP pour envoyer les emails de verification d'adresse email. */
@Injectable()
export class VerificationMailerService implements IEmailVerificationNotifier {
  private readonly logger = new Logger(VerificationMailerService.name);
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
      'Verification mailer disabled: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS not fully configured',
    );
  }

  async sendVerificationEmail(
    payload: EmailVerificationNotificationPayload,
  ): Promise<void> {
    if (!this.transporter) {
      return;
    }

    const fullName = `${payload.firstName} ${payload.lastName}`.trim();
    const subject = 'Verifiez votre adresse email';

    await this.transporter.sendMail({
      from: this.from,
      to: payload.email,
      subject,
      text: [
        `Bonjour ${fullName},`,
        '',
        'Merci pour votre inscription ! Veuillez verifier votre adresse email en cliquant sur le lien ci-dessous.',
        `Ce lien est valide ${payload.expiresInMinutes} minutes :`,
        payload.verificationUrl,
        '',
        "Si vous n'etes pas a l'origine de cette inscription, vous pouvez ignorer cet email.",
      ].join('\n'),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#111;">Verification de votre email</h2>
            <p>Bonjour ${this.escapeHtml(fullName)},</p>
            <p>
              Merci pour votre inscription ! Veuillez verifier votre adresse email en cliquant
              sur le bouton ci-dessous. Ce lien est valide <strong>${payload.expiresInMinutes} minutes</strong>.
            </p>
            <p style="margin:24px 0;">
              <a href="${this.escapeHtml(payload.verificationUrl)}" style="display:inline-block; background:#0f172a; color:#fff; text-decoration:none; padding:12px 18px; border-radius:8px;">
                Verifier mon email
              </a>
            </p>
            <p style="word-break:break-all; color:#334155;">${this.escapeHtml(payload.verificationUrl)}</p>
            <p style="font-size:12px; color:#64748b; margin-top:24px;">
              Si vous n'etes pas a l'origine de cette inscription, ignorez cet email.
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
