import { Injectable } from '@nestjs/common';
import { safeHtml } from '../../../common/domain/texte/nettoyage/html-escape.util';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import type {
  IEmailVerificationNotifier,
  EmailVerificationNotificationPayload,
} from '../domain/notifications/IEmailVerificationNotifier';
import {
  MailerDeLienTemporaire,
  type RedactionDUnLien as Redaction,
} from './MailerDeLienTemporaire';

const VERIFICATION: Readonly<Record<SupportedLocale, Redaction>> = {
  fr: {
    sujet: 'Verifiez votre adresse email',
    titre: safeHtml`Verification de votre email`,
    intro:
      'Merci pour votre inscription ! Veuillez verifier votre adresse email en cliquant sur le lien ci-dessous.',
    bouton: 'Verifier mon email',
    avertissement:
      "Si vous n'etes pas a l'origine de cette inscription, vous pouvez ignorer cet email.",
  },
  en: {
    sujet: 'Verify your email address',
    titre: safeHtml`Email verification`,
    intro:
      'Thank you for signing up! Please verify your email address by clicking the button below.',
    bouton: 'Verify my email',
    avertissement: 'If you did not sign up, you can ignore this email.',
  },
};

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
      ...VERIFICATION[payload.locale],
      destinataire: payload,
      lien: payload.verificationUrl,
      expireEnMinutes: payload.expiresInMinutes,
    });
  }
}
