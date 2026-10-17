/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { buildConfigService } from '../../../../../test/factories/env.factory';
import { buildUser } from '../../../../../test/factories/user.factory';
import { createMockEmailVerificationTokensRepo } from '../../../../../test/factories/email-verification-token.factory';
import { createMockEmailVerificationNotifier } from '../../../../../test/factories/mailer.factory';
import { espionnerLeLoggerAChaqueTest } from '../../../../../test/helpers/silence-nest-logger';
import { TROIS_ENVOIS_PAR_HEURE } from '../../domain/PlafondDEnvois';
import { TokenHash } from '../../domain/TokenHash';
import { EnvoiDeVerificationEmail } from './email-verification-dispatch';

function construire(base = 'https://asilidesign.fr/verify-email') {
  const tokensRepo = createMockEmailVerificationTokensRepo();
  const notifier = createMockEmailVerificationNotifier();
  const config = buildConfigService({ EMAIL_VERIFICATION_URL_BASE: base });
  const logger = new Logger('test');
  return {
    tokensRepo,
    notifier,
    logger,
    envoi: new EnvoiDeVerificationEmail(tokensRepo, notifier, config),
  };
}

describe('EnvoiDeVerificationEmail', () => {
  const user = buildUser({ id: 'user-7', email: 'eve@example.com' });
  const avertissements = espionnerLeLoggerAChaqueTest('warn');

  it('n enregistre que l empreinte du jeton envoye dans le lien', async () => {
    const { tokensRepo, notifier, logger, envoi } = construire();

    await envoi.envoyer(user, 'user-7', logger, 'Echec');

    const lien = new URL(
      notifier.sendVerificationEmail.mock.calls[0][0].verificationUrl,
    );
    const jetonBrut = lien.searchParams.get('token') ?? '';
    expect(jetonBrut).toMatch(/^[0-9a-f]{64}$/);
    expect(tokensRepo.remplacerLesJetonsActifs).toHaveBeenCalledWith(
      {
        userId: 'user-7',
        tokenHash: TokenHash.fromRaw(jetonBrut).value,
        expiresAt: expect.any(Date) as Date,
      },
      TROIS_ENVOIS_PAR_HEURE,
    );
    expect(notifier.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'eve@example.com',
        verificationUrl: `https://asilidesign.fr/verify-email?token=${jetonBrut}`,
        expiresInMinutes: 1440,
      }),
    );
  });

  it('expire les liens encore actifs du compte sans les effacer avant d en emettre un neuf', async () => {
    const { tokensRepo, logger, envoi } = construire();

    await envoi.envoyer(user, 'user-7', logger, 'Echec');

    expect(tokensRepo.remplacerLesJetonsActifs).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-7' }),
      TROIS_ENVOIS_PAR_HEURE,
    );
    expect(tokensRepo.deleteByUserId).not.toHaveBeenCalled();
  });

  it('journalise l echec d envoi sans le propager', async () => {
    const { notifier, logger, envoi } = construire();
    notifier.sendVerificationEmail.mockRejectedValue(new Error('smtp'));

    await expect(
      envoi.envoyer(user, 'user-7', logger, 'Echec du renvoi'),
    ).resolves.toBeUndefined();

    expect(avertissements()).toHaveBeenCalledWith(
      'Echec du renvoi for eve@example.com: smtp',
    );
    expect(avertissements().mock.contexts).toEqual([logger]);
  });
});
