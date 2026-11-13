import {
  attendreLeMailAvecSonLien,
  moduleSmtpSimule,
  viderLeSmtpSimuleAChaqueTest,
} from '../../../../test/factories/mailer.factory';
import { urlDuSite } from '../../../config/urls-publiques';

jest.mock('../../../common/infrastructure/mail/smtp-transporter.util', () =>
  moduleSmtpSimule(),
);

import { NewsletterMailerService } from './NewsletterMailer.service';

const JETON = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';
const EXPIRE_LE = new Date('2026-11-19T10:00:00.000Z');

describe('NewsletterMailerService', () => {
  viderLeSmtpSimuleAChaqueTest();

  it.each([
    [
      'en' as const,
      'Confirm your Asili Design newsletter subscription',
      'Confirm my subscription',
    ],
    [
      'fr' as const,
      'Confirmez votre abonnement à la newsletter Asili Design',
      'Confirmer mon abonnement',
    ],
  ])(
    'NL-02 · redige le mail de confirmation en %s, avec le lien de la page de confirmation de cette langue',
    async (locale, sujet, bouton) => {
      await new NewsletterMailerService().envoyerLaConfirmation({
        email: 'jane@mail.com',
        locale,
        jeton: JETON,
        expireLe: EXPIRE_LE,
      });

      const mail = attendreLeMailAvecSonLien({
        sujet,
        bouton,
        lien: `${urlDuSite()}/${locale}/newsletter/confirm?token=${JETON}`,
      });
      expect(mail.to).toBe('jane@mail.com');
    },
  );

  it.each([
    [
      'en' as const,
      'You are already subscribed to the Asili Design newsletter',
      'Unsubscribe',
    ],
    [
      'fr' as const,
      'Vous êtes déjà abonné à la newsletter Asili Design',
      'Me désabonner',
    ],
  ])(
    'NL-18 · redige le mail deja abonne en %s, avec le lien de desabonnement de cette langue',
    async (locale, sujet, bouton) => {
      await new NewsletterMailerService().envoyerDejaAbonne({
        email: 'jane@mail.com',
        locale,
        jetonDeDesabonnement: JETON,
      });

      attendreLeMailAvecSonLien({
        sujet,
        bouton,
        lien: `${urlDuSite()}/${locale}/newsletter/unsubscribe?token=${JETON}`,
      });
    },
  );
});
