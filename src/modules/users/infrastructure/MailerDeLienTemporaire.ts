import { ExpediteurSmtp } from '../../../common/infrastructure/mail/expediteur-smtp';
import {
  escapeUrl,
  safeHtml,
  type EscapedHtml,
} from '../../../common/infrastructure/mail/html-escape.util';

export interface LienTemporaire {
  destinataire: { email: string; firstName: string; lastName: string };
  sujet: string;
  titre: EscapedHtml;
  introTexte: string;
  introHtml: EscapedHtml;
  lien: string;
  expireEnMinutes: number;
  libelleBouton: EscapedHtml;
  avertissementTexte: string;
  avertissementHtml: EscapedHtml;
}

export abstract class MailerDeLienTemporaire extends ExpediteurSmtp {
  protected async envoyerLien(contenu: LienTemporaire): Promise<void> {
    if (!this.transporter) {
      return;
    }

    const { destinataire, lien } = contenu;
    const fullName =
      `${destinataire.firstName} ${destinataire.lastName}`.trim();

    await this.transporter.sendMail({
      from: this.from,
      to: destinataire.email,
      subject: contenu.sujet,
      text: [
        `Bonjour ${fullName},`,
        '',
        contenu.introTexte,
        `Ce lien est valide ${contenu.expireEnMinutes} minutes :`,
        lien,
        '',
        contenu.avertissementTexte,
      ].join('\n'),
      html: safeHtml`
        <div style="font-family:Arial,Helvetica,sans-serif; background:#f7f7f7; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px;">
            <h2 style="margin-top:0; color:#111;">${contenu.titre}</h2>
            <p>Bonjour ${this.escapeHtml(fullName)},</p>
            <p>
              ${contenu.introHtml}
              Ce lien est valide <strong>${contenu.expireEnMinutes} minutes</strong>.
            </p>
            <p style="margin:24px 0;">
              <a href="${escapeUrl(lien)}" style="display:inline-block; background:#0f172a; color:#fff; text-decoration:none; padding:12px 18px; border-radius:8px;">
                ${contenu.libelleBouton}
              </a>
            </p>
            <p style="word-break:break-all; color:#334155;">${this.escapeHtml(lien)}</p>
            <p style="font-size:12px; color:#64748b; margin-top:24px;">
              ${contenu.avertissementHtml}
            </p>
          </div>
        </div>
      `,
    });
  }
}
