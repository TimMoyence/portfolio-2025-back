import { Injectable } from '@nestjs/common';
import { PAGE_PRIVEE_DU_TOOLKIT } from '../../../common/domain/liens/lien-avec-jeton';
import { ExpediteurSmtp } from '../../../common/infrastructure/mail/expediteur-smtp';
import {
  escapeHtml,
  escapeUrl,
  safeHtml,
  type EscapedHtml,
} from '../../../common/domain/texte/nettoyage/html-escape.util';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import { pieceJointePdf } from '../../../common/infrastructure/mail/piece-jointe';
import { adresseDeReponse } from '../../../config/adresses-de-courriel';
import { urlDuSite } from '../../../config/urls-publiques';
import type { ILeadMagnetNotifier } from '../domain/ILeadMagnetNotifier';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';

interface MailDuGuide {
  readonly objet: (prenom: string) => string;
  readonly texte: (prenom: string, lien: string) => string;
  readonly lienTexte: (url: string) => string;
  readonly html: (prenom: EscapedHtml, lien: EscapedHtml) => EscapedHtml;
  readonly bouton: EscapedHtml;
}

function boutonDuGuide(url: string, libelle: EscapedHtml): EscapedHtml {
  return safeHtml`<p style="margin: 20px 0;"><a href="${escapeUrl(url)}" style="display: inline-block; padding: 12px 24px; background-color: #4fb3a2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">${libelle}</a></p>`;
}

const MAILS: Readonly<Record<SupportedLocale, MailDuGuide>> = {
  fr: {
    objet: (prenom) => `Votre guide IA personnalise, ${prenom}`,
    lienTexte: (url) =>
      `\n\nAccedez a votre guide personnalise en ligne :\n${url}`,
    texte: (prenom, lien) =>
      `Bonjour ${prenom},\n\nMerci d'avoir parcouru le guide "L'IA au service des solopreneurs" sur asilidesign.fr.\n\nVotre guide IA personnalise est en piece jointe. Il contient :\n- Votre cheatsheet d'outils IA adaptee a votre profil\n- Des prompts selectionnes selon votre niveau\n- Des workflows d'automatisation prets a utiliser\n- Des templates pour demarrer immediatement${lien}\n\n3 actions pour cette semaine :\n1. Ouvrez votre guide et choisissez 1 outil de la cheatsheet a tester\n2. Adaptez 1 prompt a votre activite et utilisez-le des aujourd'hui\n3. Identifiez 1 workflow a mettre en place ce mois-ci\n\nUne question, un retour ou besoin d'un accompagnement ? Repondez simplement a cet email, je le lis.\n\nTim — Asili Design\nasilidesign.fr`,
    bouton: safeHtml`Voir mon guide personnalise en ligne`,
    html: (prenom, lien) =>
      safeHtml`<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Votre guide IA personnalise</h2><p>Bonjour ${prenom},</p><p>Merci d'avoir parcouru le guide <strong>"L'IA au service des solopreneurs"</strong> sur asilidesign.fr.</p><p>Votre guide IA personnalise est en piece jointe. Il contient :</p><ul><li>Votre cheatsheet d'outils IA adaptee a votre profil</li><li>Des prompts selectionnes selon votre niveau</li><li>Des workflows d'automatisation prets a utiliser</li><li>Des templates pour demarrer immediatement</li></ul>${lien}<h3 style="color: #333;">3 actions pour cette semaine</h3><ol><li>Ouvrez votre guide et choisissez 1 outil de la cheatsheet a tester</li><li>Adaptez 1 prompt a votre activite et utilisez-le des aujourd'hui</li><li>Identifiez 1 workflow a mettre en place ce mois-ci</li></ol><p>Une question, un retour ou besoin d'un accompagnement ? <strong>Repondez simplement a cet email</strong>, je le lis.</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Tim — Asili Design<br /><a href="https://asilidesign.fr" style="color: #4fb3a2;">asilidesign.fr</a></p></div></div>`,
  },
  en: {
    objet: (prenom) => `Your personalised AI guide, ${prenom}`,
    lienTexte: (url) => `\n\nView your personalised guide online:\n${url}`,
    texte: (prenom, lien) =>
      `Hello ${prenom},\n\nThank you for going through the "AI for solopreneurs" guide on asilidesign.fr.\n\nYour personalised AI guide is attached. It contains:\n- An AI tools cheatsheet tailored to your profile\n- Prompts selected for your level\n- Ready-to-use automation workflows\n- Templates to get started right away\n\nThe guide and its online page are in French.${lien}\n\n3 actions for this week:\n1. Open your guide and pick 1 tool from the cheatsheet to try\n2. Adapt 1 prompt to your business and use it today\n3. Choose 1 workflow to set up this month\n\nA question, some feedback or need support? Just reply to this email, I read it.\n\nTim — Asili Design\nasilidesign.fr`,
    bouton: safeHtml`View my personalised guide online`,
    html: (prenom, lien) =>
      safeHtml`<div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 24px;"><div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;"><h2 style="margin-top: 0; color: #4fb3a2;">Your personalised AI guide</h2><p>Hello ${prenom},</p><p>Thank you for going through the <strong>"AI for solopreneurs"</strong> guide on asilidesign.fr.</p><p>Your personalised AI guide is attached. It contains:</p><ul><li>An AI tools cheatsheet tailored to your profile</li><li>Prompts selected for your level</li><li>Ready-to-use automation workflows</li><li>Templates to get started right away</li></ul><p>The guide and its online page are in French.</p>${lien}<h3 style="color: #333;">3 actions for this week</h3><ol><li>Open your guide and pick 1 tool from the cheatsheet to try</li><li>Adapt 1 prompt to your business and use it today</li><li>Choose 1 workflow to set up this month</li></ol><p>A question, some feedback or need support? <strong>Just reply to this email</strong>, I read it.</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" /><p style="font-size: 12px; color: #666;">Tim — Asili Design<br /><a href="https://asilidesign.fr" style="color: #4fb3a2;">asilidesign.fr</a></p></div></div>`,
  },
};

@Injectable()
export class LeadMagnetMailerService
  extends ExpediteurSmtp
  implements ILeadMagnetNotifier
{
  private readonly replyTo = adresseDeReponse();
  private readonly frontendUrl = urlDuSite();

  constructor() {
    super(LeadMagnetMailerService.name, 'Lead magnet mailer');
  }

  async sendToolkitEmail(
    request: LeadMagnetRequest,
    pdfBuffer: Buffer,
  ): Promise<void> {
    const mail = MAILS[request.termsLocale];
    const toolkitUrl = request.accessToken
      ? `${this.frontendUrl}${PAGE_PRIVEE_DU_TOOLKIT}${request.accessToken}`
      : null;

    await this.envoyer({
      to: request.email,
      replyTo: this.replyTo,
      subject: mail.objet(request.firstName),
      text: mail.texte(
        request.firstName,
        toolkitUrl ? mail.lienTexte(toolkitUrl) : '',
      ),
      html: mail.html(
        escapeHtml(request.firstName),
        toolkitUrl ? boutonDuGuide(toolkitUrl, mail.bouton) : safeHtml``,
      ),
      attachments: [pieceJointePdf('guide-ia-solopreneurs.pdf', pdfBuffer)],
    });
  }
}
