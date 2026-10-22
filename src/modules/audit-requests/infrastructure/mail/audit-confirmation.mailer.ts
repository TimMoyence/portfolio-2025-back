import { Injectable } from '@nestjs/common';
import type { DemandeDeConfirmation } from '../../domain/IAuditNotifier.port';
import { buildMailLayout } from './mail-layout.util';
import { MailerDAudit } from './mailer-d-audit';
import { escapeHtml, escapeUrl, safeHtml } from './mail-rendering.util';

const TEXTES = {
  fr: {
    objet: (hote: string) => `Confirmez l'audit de ${hote}`,
    titre: 'Confirmez votre demande d’audit',
    intro: (hote: string) =>
      `Une demande d’audit du site ${hote} a été faite avec cette adresse. L’audit ne démarre qu’après votre confirmation.`,
    bouton: 'Lancer l’audit',
    avertissement:
      'Vous n’êtes pas à l’origine de cette demande ? Ignorez ce message : aucun audit ne sera lancé et rien ne vous sera envoyé.',
    validite: 'Ce lien reste valable 24 heures.',
  },
  en: {
    objet: (hote: string) => `Confirm the audit of ${hote}`,
    titre: 'Confirm your audit request',
    intro: (hote: string) =>
      `An audit of ${hote} was requested with this address. The audit only starts once you confirm.`,
    bouton: 'Start the audit',
    avertissement:
      'You did not make this request? Ignore this message: no audit will run and nothing will be sent to you.',
    validite: 'This link stays valid for 24 hours.',
  },
} as const;

@Injectable()
export class AuditConfirmationMailer extends MailerDAudit {
  async demanderLaConfirmation(demande: DemandeDeConfirmation): Promise<void> {
    const textes = TEXTES[demande.locale];
    await this.envoyer({
      to: demande.to,
      subject: textes.objet(demande.hote),
      text: [
        textes.intro(demande.hote),
        '',
        `${textes.bouton} : ${demande.lien}`,
        '',
        textes.validite,
        textes.avertissement,
      ].join('\n'),
      html: buildMailLayout({
        heroTitle: textes.titre,
        preheader: textes.intro(demande.hote),
        bodyHtml: safeHtml`
          <p style="margin-top:0;">${escapeHtml(textes.intro(demande.hote))}</p>
          <p style="margin:24px 0;">
            <a href="${escapeUrl(demande.lien)}" style="display:inline-block;padding:12px 20px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">${escapeHtml(textes.bouton)}</a>
          </p>
          <p style="color:#6b7280;font-size:13px;">${escapeHtml(textes.validite)}<br/>${escapeHtml(textes.avertissement)}</p>`,
      }),
    });
  }
}
