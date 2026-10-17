import { Injectable } from '@nestjs/common';
import { safeHtml } from '../../../common/domain/texte/html-escape.util';
import type {
  IPasswordResetNotifier,
  PasswordResetNotificationPayload,
} from '../domain/IPasswordResetNotifier';
import { MailerDeLienTemporaire } from './MailerDeLienTemporaire';

@Injectable()
export class PasswordResetMailerService
  extends MailerDeLienTemporaire
  implements IPasswordResetNotifier
{
  constructor() {
    super(PasswordResetMailerService.name, 'Password reset mailer');
  }

  sendPasswordResetEmail(
    payload: PasswordResetNotificationPayload,
  ): Promise<void> {
    return this.envoyerLien({
      destinataire: payload,
      sujet: 'Reinitialisation de votre mot de passe',
      titre: safeHtml`Reinitialisation du mot de passe`,
      introTexte:
        'Nous avons recu une demande de reinitialisation de mot de passe.',
      introHtml: safeHtml`Nous avons recu une demande de reinitialisation de mot de passe.`,
      lien: payload.resetUrl,
      expireEnMinutes: payload.expiresInMinutes,
      libelleBouton: safeHtml`Reinitialiser mon mot de passe`,
      avertissementTexte:
        "Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer cet email.",
      avertissementHtml: safeHtml`Si vous n'etes pas a l'origine de cette demande, ignorez cet email.`,
    });
  }

  sendRegistrationAttemptEmail(
    payload: PasswordResetNotificationPayload,
  ): Promise<void> {
    return this.envoyerLien({
      destinataire: payload,
      sujet: "Tentative d'inscription avec votre adresse email",
      titre: safeHtml`Tentative d'inscription`,
      introTexte:
        "Quelqu'un a tente de creer un compte avec votre adresse email. Si c'est vous, connectez-vous, ou reinitialisez votre mot de passe avec ce lien.",
      introHtml: safeHtml`Quelqu'un a tente de creer un compte avec votre adresse email. Si c'est vous, connectez-vous, ou reinitialisez votre mot de passe avec ce lien.`,
      lien: payload.resetUrl,
      expireEnMinutes: payload.expiresInMinutes,
      libelleBouton: safeHtml`Reinitialiser mon mot de passe`,
      avertissementTexte:
        "Si vous n'etes pas a l'origine de cette tentative, ignorez cet email : votre compte n'a pas change.",
      avertissementHtml: safeHtml`Si vous n'etes pas a l'origine de cette tentative, ignorez cet email : votre compte n'a pas change.`,
    });
  }
}
