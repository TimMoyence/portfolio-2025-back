import {
  mailSimule,
  moduleSmtpSimule,
} from '../../../../test/factories/mailer.factory';

jest.mock('../../../common/infrastructure/mail/smtp-transporter.util', () =>
  moduleSmtpSimule(),
);

import { PasswordResetMailerService } from './PasswordResetMailer.service';
import { VerificationMailerService } from './VerificationMailer.service';

const DESTINATAIRE = {
  email: 'jane@mail.com',
  firstName: 'Jane',
  lastName: 'Doe',
  expiresInMinutes: 30,
};
const LIEN = 'https://asilidesign.fr/en/reset-password?token=abc';

describe('Mails du compte en anglais', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CPT-02 · redige en anglais la verification de l email d un compte anglais', async () => {
    await new VerificationMailerService().sendVerificationEmail({
      ...DESTINATAIRE,
      locale: 'en',
      verificationUrl: LIEN,
    });

    const mail = mailSimule();
    expect(mail.subject).toBe('Verify your email address');
    expect(mail.text).toContain('Hello Jane Doe,');
    expect(mail.text).toContain('This link is valid for 30 minutes.');
    expect(mail.html).toContain('Verify my email');
  });

  it('CPT-02 · redige en anglais la reinitialisation du mot de passe d un compte anglais', async () => {
    await new PasswordResetMailerService().sendPasswordResetEmail({
      ...DESTINATAIRE,
      locale: 'en',
      resetUrl: LIEN,
    });

    const mail = mailSimule();
    expect(mail.subject).toBe('Reset your password');
    expect(mail.html).toContain('Reset my password');
    expect(mail.html).toContain(LIEN);
  });

  it('CPT-02 · previent en anglais le titulaire anglais d une tentative d inscription', async () => {
    await new PasswordResetMailerService().sendRegistrationAttemptEmail({
      ...DESTINATAIRE,
      locale: 'en',
      resetUrl: LIEN,
    });

    expect(mailSimule().subject).toBe(
      'Sign-up attempt with your email address',
    );
  });

  it('CPT-02 · garde le francais pour un compte francais', async () => {
    await new VerificationMailerService().sendVerificationEmail({
      ...DESTINATAIRE,
      locale: 'fr',
      verificationUrl: LIEN,
    });

    expect(mailSimule().subject).toBe('Verifiez votre adresse email');
  });
});
