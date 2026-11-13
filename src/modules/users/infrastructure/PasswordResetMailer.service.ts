import { Injectable } from '@nestjs/common';
import { safeHtml } from '../../../common/domain/texte/nettoyage/html-escape.util';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import type {
  IPasswordResetNotifier,
  PasswordResetNotificationPayload,
} from '../domain/notifications/IPasswordResetNotifier';
import {
  MailerDeLienTemporaire,
  type RedactionDUnLien as Redaction,
} from './MailerDeLienTemporaire';

const REINITIALISATION: Readonly<Record<SupportedLocale, Redaction>> = {
  fr: {
    sujet: 'Reinitialisation de votre mot de passe',
    titre: safeHtml`Reinitialisation du mot de passe`,
    intro: 'Nous avons recu une demande de reinitialisation de mot de passe.',
    bouton: 'Reinitialiser mon mot de passe',
    avertissement:
      "Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer cet email.",
  },
  en: {
    sujet: 'Reset your password',
    titre: safeHtml`Password reset`,
    intro: 'We received a request to reset your password.',
    bouton: 'Reset my password',
    avertissement:
      'If you did not make this request, you can ignore this email.',
  },
};

const TENTATIVE_D_INSCRIPTION: Readonly<Record<SupportedLocale, Redaction>> = {
  fr: {
    sujet: "Tentative d'inscription avec votre adresse email",
    titre: safeHtml`Tentative d'inscription`,
    intro:
      "Quelqu'un a tente de creer un compte avec votre adresse email. Si c'est vous, connectez-vous, ou reinitialisez votre mot de passe avec ce lien.",
    bouton: 'Reinitialiser mon mot de passe',
    avertissement:
      "Si vous n'etes pas a l'origine de cette tentative, ignorez cet email : votre compte n'a pas change.",
  },
  en: {
    sujet: 'Sign-up attempt with your email address',
    titre: safeHtml`Sign-up attempt`,
    intro:
      'Someone tried to create an account with your email address. If it was you, log in, or reset your password with this link.',
    bouton: 'Reset my password',
    avertissement:
      'If it was not you, ignore this email: your account has not changed.',
  },
};

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
      ...REINITIALISATION[payload.locale],
      destinataire: payload,
      lien: payload.resetUrl,
      expireEnMinutes: payload.expiresInMinutes,
    });
  }

  sendRegistrationAttemptEmail(
    payload: PasswordResetNotificationPayload,
  ): Promise<void> {
    return this.envoyerLien({
      ...TENTATIVE_D_INSCRIPTION[payload.locale],
      destinataire: payload,
      lien: payload.resetUrl,
      expireEnMinutes: payload.expiresInMinutes,
    });
  }
}
