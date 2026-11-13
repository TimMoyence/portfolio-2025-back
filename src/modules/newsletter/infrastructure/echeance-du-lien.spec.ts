import {
  mailSimule,
  moduleSmtpSimule,
} from '../../../../test/factories/mailer.factory';

jest.mock('../../../common/infrastructure/mail/smtp-transporter.util', () =>
  moduleSmtpSimule(),
);

import { NewsletterMailerService } from './NewsletterMailer.service';

describe('NewsletterMailerService · échéance du lien', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['fr' as const, 'Ce lien est valable jusqu’au 19 novembre 2026 à 00:30.'],
    ['en' as const, 'This link is valid until 19 November 2026 at 00:30.'],
  ])(
    'NL-02 NL-03 · annonce en %s le jour et l heure d expiration du lien, a l heure de Paris',
    async (locale, phrase) => {
      await new NewsletterMailerService().envoyerLaConfirmation({
        email: 'jane@mail.com',
        locale,
        jeton: '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d',
        expireLe: new Date('2026-11-18T23:30:00.000Z'),
      });

      const mail = mailSimule();
      expect(mail.text).toContain(phrase);
      expect(mail.html).toContain(phrase);
    },
  );
});
