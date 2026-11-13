import { Logger } from '@nestjs/common';
import { buildConfigService } from '../../../../../test/factories/env.factory';
import { buildUser } from '../../../../../test/factories/comptes/user.factory';
import { createMockEmailVerificationTokensRepo } from '../../../../../test/factories/comptes/email-verification-token.factory';
import { createMockPasswordResetTokensRepo } from '../../../../../test/factories/comptes/password-reset-token.factory';
import {
  createMockEmailVerificationNotifier,
  createMockPasswordResetNotifier,
} from '../../../../../test/factories/mailer.factory';
import { EnvoiDeVerificationEmail } from './email-verification-dispatch';
import { EnvoiDeReinitialisation } from './password-reset-dispatch';

const CONFIG = buildConfigService({
  EMAIL_VERIFICATION_URL_BASE: 'https://asilidesign.fr/verify-email',
  PASSWORD_RESET_URL_BASE: 'https://asilidesign.fr/reset-password',
});

describe('Liens du compte dans sa langue', () => {
  const compteAnglais = buildUser({ id: 'user-en', locale: 'en' });

  it('CPT-02 · envoie a un compte anglais le lien de verification de la page anglaise', async () => {
    const notifier = createMockEmailVerificationNotifier();
    const envoi = new EnvoiDeVerificationEmail(
      createMockEmailVerificationTokensRepo(),
      notifier,
      CONFIG,
    );

    await envoi.envoyer(compteAnglais, 'user-en', new Logger('test'), 'Echec');

    const [[payload]] = notifier.sendVerificationEmail.mock.calls;
    expect(payload.locale).toBe('en');
    expect(payload.verificationUrl).toMatch(
      /^https:\/\/asilidesign\.fr\/en\/verify-email\?token=[0-9a-f]{64}$/,
    );
  });

  it('CPT-02 · envoie a un compte anglais le lien de reinitialisation de la page anglaise', async () => {
    const notifier = createMockPasswordResetNotifier();
    const envoi = new EnvoiDeReinitialisation(
      createMockPasswordResetTokensRepo(),
      notifier,
      CONFIG,
    );

    await envoi.envoyer(compteAnglais, 'demande', new Logger('test'));

    const [[payload]] = notifier.sendPasswordResetEmail.mock.calls;
    expect(payload.resetUrl).toMatch(
      /^https:\/\/asilidesign\.fr\/en\/reset-password\?token=[0-9a-f]{64}$/,
    );
  });
});
