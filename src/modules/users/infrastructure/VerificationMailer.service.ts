import { Injectable } from '@nestjs/common';
import { safeHtml } from '../../../common/infrastructure/mail/html-escape.util';
import type {
  IEmailVerificationNotifier,
  EmailVerificationNotificationPayload,
} from '../domain/IEmailVerificationNotifier';
import { MailerDeLienTemporaire } from './MailerDeLienTemporaire';

@Injectable()
export class VerificationMailerService
  extends MailerDeLienTemporaire
  implements IEmailVerificationNotifier
{
  constructor() {
    super(VerificationMailerService.name, 'Verification mailer');
  }

  sendVerificationEmail(
    payload: EmailVerificationNotificationPayload,
  ): Promise<void> {
    return this.envoyerLien({
      destinataire: payload,
      sujet: 'Verifiez votre adresse email',
      titre: safeHtml`Verification de votre email`,
      introTexte:
        'Merci pour votre inscription ! Veuillez verifier votre adresse email en cliquant sur le lien ci-dessous.',
      introHtml: safeHtml`Merci pour votre inscription ! Veuillez verifier votre adresse email en cliquant
              sur le bouton ci-dessous.`,
      lien: payload.verificationUrl,
      expireEnMinutes: payload.expiresInMinutes,
      libelleBouton: safeHtml`Verifier mon email`,
      avertissementTexte:
        "Si vous n'etes pas a l'origine de cette inscription, vous pouvez ignorer cet email.",
      avertissementHtml: safeHtml`Si vous n'etes pas a l'origine de cette inscription, ignorez cet email.`,
    });
  }
}
