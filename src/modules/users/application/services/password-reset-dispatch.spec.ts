/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { buildConfigService } from '../../../../../test/factories/env.factory';
import { createMockPasswordResetNotifier } from '../../../../../test/factories/mailer.factory';
import {
  buildPasswordResetToken,
  createMockPasswordResetTokensRepo,
} from '../../../../../test/factories/password-reset-token.factory';
import { buildUser } from '../../../../../test/factories/user.factory';
import { espionnerLeLoggerAChaqueTest } from '../../../../../test/helpers/silence-nest-logger';
import { TROIS_ENVOIS_PAR_HEURE } from '../../domain/PlafondDEnvois';
import { TokenHash } from '../../domain/TokenHash';
import {
  EnvoiDeReinitialisation,
  type MotifDuLienDeReinitialisation,
} from './password-reset-dispatch';

function construire() {
  const tokensRepo = createMockPasswordResetTokensRepo();
  tokensRepo.remplacerLesJetonsActifs.mockResolvedValue(
    buildPasswordResetToken(),
  );
  const notifier = createMockPasswordResetNotifier();
  const config = buildConfigService({
    PASSWORD_RESET_URL_BASE: 'https://asilidesign.fr/reset-password',
  });
  return {
    tokensRepo,
    notifier,
    logger: new Logger('test'),
    envoi: new EnvoiDeReinitialisation(tokensRepo, notifier, config),
  };
}

const MOTIFS: ReadonlyArray<
  [
    MotifDuLienDeReinitialisation,
    'sendPasswordResetEmail' | 'sendRegistrationAttemptEmail',
    string,
  ]
> = [
  ['demande', 'sendPasswordResetEmail', 'Password reset email failed'],
  [
    'tentative-d-inscription',
    'sendRegistrationAttemptEmail',
    'Registration attempt email failed',
  ],
];

describe('EnvoiDeReinitialisation', () => {
  const titulaire = buildUser({
    id: 'user-5',
    email: 'lea@example.com',
    passwordHash: 'hash',
  });
  const avertissements = espionnerLeLoggerAChaqueTest('warn');

  describe.each(MOTIFS)('pour le motif %s', (motif, courriel, echec) => {
    it('envoie par son courriel un lien d une heure dont seule l empreinte est enregistree', async () => {
      const { tokensRepo, notifier, logger, envoi } = construire();

      await envoi.envoyer(titulaire, motif, logger);

      expect(notifier[courriel]).toHaveBeenCalledTimes(1);
      const [payload] = notifier[courriel].mock.calls[0];
      const jetonBrut = new URL(payload.resetUrl).searchParams.get('token');
      expect(payload).toEqual({
        email: 'lea@example.com',
        firstName: titulaire.firstName,
        lastName: titulaire.lastName,
        resetUrl: `https://asilidesign.fr/reset-password?token=${jetonBrut}`,
        expiresInMinutes: 60,
      });
      expect(tokensRepo.remplacerLesJetonsActifs).toHaveBeenCalledWith(
        {
          userId: 'user-5',
          tokenHash: TokenHash.fromRaw(jetonBrut ?? '').value,
          expiresAt: expect.any(Date) as Date,
        },
        TROIS_ENVOIS_PAR_HEURE,
      );
    });

    it.each([
      ['aucun compte', null],
      ['un compte inactif', buildUser({ id: 'user-5', isActive: false })],
      [
        'un compte Google sans mot de passe',
        buildUser({ id: 'user-5', passwordHash: null, googleId: 'g-5' }),
      ],
    ])('n emet aucun lien pour %s', async (_cas, compte) => {
      const { tokensRepo, notifier, logger, envoi } = construire();

      await envoi.envoyer(compte, motif, logger);

      expect(tokensRepo.remplacerLesJetonsActifs).not.toHaveBeenCalled();
      expect(notifier[courriel]).not.toHaveBeenCalled();
    });

    it('nomme son courriel dans le journal d un echec d envoi, sans le propager', async () => {
      const { notifier, logger, envoi } = construire();
      notifier[courriel].mockRejectedValue(new Error('smtp'));

      await envoi.envoyer(titulaire, motif, logger);
      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(avertissements()).toHaveBeenCalledWith(
        `${echec} for lea@example.com: smtp`,
      );
    });
  });

  it('n envoie a une tentative d inscription que son propre courriel', async () => {
    const { notifier, logger, envoi } = construire();

    await envoi.envoyer(titulaire, 'tentative-d-inscription', logger);

    expect(notifier.sendRegistrationAttemptEmail).toHaveBeenCalledTimes(1);
    expect(notifier.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
