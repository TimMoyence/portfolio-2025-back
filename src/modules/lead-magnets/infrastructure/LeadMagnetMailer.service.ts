import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import type { ILeadMagnetNotifier } from '../domain/ILeadMagnetNotifier';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';

/** Envoie le PDF guide IA personnalise par email au participant. */
@Injectable()
export class LeadMagnetMailerService implements ILeadMagnetNotifier {
  private readonly logger = new Logger(LeadMagnetMailerService.name);
  private readonly transporter?: Transporter;
  private readonly from = process.env.SMTP_FROM;
  private readonly frontendUrl =
    process.env.FRONTEND_URL ?? 'https://asilidesign.fr';

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
    const toolkitUrl = request.accessToken
      ? `${this.frontendUrl}/formations/ia-solopreneurs/toolkit/${request.accessToken}`
      : null;

    const toolkitLinkText = toolkitUrl
      ? `\n\nAccedez a votre guide personnalise en ligne :\n${toolkitUrl}`
      : '';
    const toolkitLinkHtml = toolkitUrl
      ? `<p style="margin: 20px 0;"><a href="${toolkitUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4fb3a2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Voir mon guide personnalise en ligne</a></p>`
      : '';

    await this.transporter.sendMail({
      from: this.from,
      to: request.email,
      subject: `Votre guide IA personnalise, ${request.firstName}`,
      text: `Bonjour ${request.firstName},\n\nMerci d'avoir participe a la formation "L'IA au service des solopreneurs".\n\nVotre guide IA personnalise est en piece jointe. Il contient :\n- Votre cheatsheet d'outils IA adaptee a votre profil\n- Des prompts selectionnes selon votre niveau\n- Des workflows d'automatisation prets a utiliser\n- Des templates pour demarrer immediatement${toolkitLinkText}\n\n3 actions pour cette semaine :\n1. Ouvrez ChatGPT et testez le premier prompt de votre guide\n2. Identifiez 1 workflow a mettre en place cette semaine\n3. Installez votre premier template Notion\n\nDes questions ? Repondez a cet email.\n\nTim — Asili Design\nasilidesign.fr`,
      html: `<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Votre guide IA personnalise</h2><p>Bonjour ${firstName},</p><p>Merci d'avoir participe a la formation <strong>"L'IA au service des solopreneurs"</strong>.</p><p>Votre guide IA personnalise est en piece jointe. Il contient :</p><ul><li>Votre cheatsheet d'outils IA adaptee a votre profil</li><li>Des prompts selectionnes selon votre niveau</li><li>Des workflows d'automatisation prets a utiliser</li><li>Des templates pour demarrer immediatement</li></ul>${toolkitLinkHtml}<h3 style="color: #333;">3 actions pour cette semaine</h3><ol><li>Ouvrez <a href="https://chat.openai.com" style="color: #4fb3a2;">ChatGPT</a> et testez le premier prompt de votre guide</li><li>Identifiez 1 workflow a mettre en place cette semaine</li><li>Installez votre premier template <a href="https://notion.so" style="color: #4fb3a2;">Notion</a></li></ol><p>Des questions ? Repondez a cet email.</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Tim — Asili Design<br /><a href="https://asilidesign.fr" style="color: #4fb3a2;">asilidesign.fr</a></p></div></div>`,
      attachments: [
        {
          filename: 'guide-ia-solopreneurs.pdf',
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
