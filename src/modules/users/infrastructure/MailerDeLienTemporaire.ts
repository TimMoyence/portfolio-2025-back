import type { EscapedHtml } from '../../../common/domain/texte/nettoyage/html-escape.util';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import { corpsAvecBouton } from '../../../common/infrastructure/mail/corps/corps-avec-bouton';
import { ExpediteurSmtp } from '../../../common/infrastructure/mail/expediteur-smtp';

export interface LienTemporaire {
  destinataire: {
    email: string;
    firstName: string;
    lastName: string;
    locale: SupportedLocale;
  };
  sujet: string;
  titre: EscapedHtml;
  intro: string;
  lien: string;
  expireEnMinutes: number;
  bouton: string;
  avertissement: string;
}

const SALUTATION: Readonly<Record<SupportedLocale, (nom: string) => string>> = {
  fr: (nom) => `Bonjour ${nom},`,
  en: (nom) => `Hello ${nom},`,
};

const VALIDITE: Readonly<Record<SupportedLocale, (minutes: number) => string>> =
  {
    fr: (minutes) => `Ce lien est valide ${minutes} minutes.`,
    en: (minutes) => `This link is valid for ${minutes} minutes.`,
  };

export type RedactionDUnLien = Pick<
  LienTemporaire,
  'sujet' | 'titre' | 'intro' | 'bouton' | 'avertissement'
>;

export abstract class MailerDeLienTemporaire extends ExpediteurSmtp {
  protected async envoyerLien(contenu: LienTemporaire): Promise<void> {
    const { destinataire } = contenu;
    const nom = `${destinataire.firstName} ${destinataire.lastName}`.trim();

    await this.envoyer({
      to: destinataire.email,
      subject: contenu.sujet,
      ...corpsAvecBouton({
        titre: contenu.titre,
        paragraphes: [
          SALUTATION[destinataire.locale](nom),
          contenu.intro,
          VALIDITE[destinataire.locale](contenu.expireEnMinutes),
        ],
        bouton: contenu.bouton,
        lien: contenu.lien,
        pied: contenu.avertissement,
      }),
    });
  }
}
