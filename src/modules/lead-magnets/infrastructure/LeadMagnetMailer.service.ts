import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import type { ILeadMagnetNotifier } from '../domain/ILeadMagnetNotifier';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';

/** Envoie le PDF boite a outils par email au participant. */
@Injectable()
export class LeadMagnetMailerService implements ILeadMagnetNotifier {
  private readonly logger = new Logger(LeadMagnetMailerService.name);
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
        secure: port === 465,
        auth: { user, pass },
      }) as Transporter;
    } else {
      this.logger.warn(
        'Lead magnet mailer disabled: SMTP not fully configured',
      );
    }
  }

  async sendToolkitEmail(
    request: LeadMagnetRequest,
    pdfBuffer: Buffer,
  ): Promise<void> {
    if (!this.transporter) return;
    const firstName = this.escapeHtml(request.firstName);

    await this.transporter.sendMail({
      from: this.from,
      to: request.email,
      subject: `Votre boite a outils IA, ${request.firstName}`,
      text: `Bonjour ${request.firstName},\n\nMerci d'avoir assiste a la formation "L'IA au service des solopreneurs".\n\nVous trouverez en piece jointe votre boite a outils avec tous les outils, les prix et les budgets recommandes.\n\n3 actions pour cette semaine :\n1. Ouvrez ChatGPT et testez le prompt de la page 1\n2. Creez votre premier visuel avec Ideogram\n3. Lancez votre premiere automatisation avec Zapier (gratuit)\n\nDes questions ? Repondez a cet email.\n\nTim — Asili Design\nasilidesign.fr`,
      html: `<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Votre boite a outils IA</h2><p>Bonjour ${firstName},</p><p>Merci d'avoir assiste a la formation <strong>"L'IA au service des solopreneurs"</strong>.</p><p>Vous trouverez en piece jointe votre boite a outils avec tous les outils, les prix et les budgets recommandes.</p><h3 style="color: #333;">3 actions pour cette semaine</h3><ol><li>Ouvrez <a href="https://chat.openai.com" style="color: #4fb3a2;">ChatGPT</a> et testez un prompt</li><li>Creez votre premier visuel avec <a href="https://ideogram.ai" style="color: #4fb3a2;">Ideogram</a></li><li>Lancez votre premiere automatisation avec <a href="https://zapier.com" style="color: #4fb3a2;">Zapier</a> (gratuit)</li></ol><p>Des questions ? Repondez a cet email.</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Tim — Asili Design<br /><a href="https://asilidesign.fr" style="color: #4fb3a2;">asilidesign.fr</a></p></div></div>`,
      attachments: [
        {
          filename: 'boite-a-outils-ia-solopreneurs.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /** Echappe les caracteres HTML speciaux pour prevenir les injections XSS. */
  private escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
