import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { Contacts } from '../domain/Contacts';

@Injectable()
export class ContactMailerService {
  private readonly logger = new Logger(ContactMailerService.name);
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
        'Contact mailer disabled: MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASS not fully configured',
      );
    }
  }

  async sendContactNotification(contact: Contacts): Promise<void> {
    if (!this.transporter) return;

    const { firstName, lastName, email, phone, subject, message, role } =
      contact;

    const fullName = `${firstName} ${lastName}`;

    await this.transporter.sendMail({
      from: this.from,
      to: this.to,
      subject: `📩 Nouveau message de contact — ${subject}`,
      text: `
NOUVEAU MESSAGE DE CONTACT
-------------------------

Nom        : ${fullName}
Email      : ${email}
Téléphone  : ${phone ?? 'Non renseigné'}
Rôle       : ${role ?? 'Non renseigné'}
Sujet      : ${subject}

Message :
${message}
      `.trim(),
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#333;">📩 Nouveau message de contact</h2>

            <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
              <tr>
                <td style="padding:6px 0; font-weight:bold; width:120px;">Nom</td>
                <td style="padding:6px 0;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:bold;">Email</td>
                <td style="padding:6px 0;">
                  <a href="mailto:${email}">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:bold;">Téléphone</td>
                <td style="padding:6px 0;">${phone ?? 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:bold;">Rôle</td>
                <td style="padding:6px 0;">${role ?? 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:bold;">Sujet</td>
                <td style="padding:6px 0;">${subject}</td>
              </tr>
            </table>

            <div style="margin-top:16px;">
              <p style="font-weight:bold; margin-bottom:8px;">Message :</p>
              <div style="white-space:pre-line; background:#fafafa; border-left:4px solid #4f46e5; padding:12px;">
                ${message}
              </div>
            </div>

            <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />

            <p style="font-size:12px; color:#666; margin:0;">
              Message envoyé depuis le formulaire de contact du site.
            </p>
          </div>
        </div>
      `,
    });
  }
}
