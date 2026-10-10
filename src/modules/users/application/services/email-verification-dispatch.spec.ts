/* eslint-disable @typescript-eslint/unbound-method */
import type { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import type { IEmailVerificationNotifier } from '../../domain/IEmailVerificationNotifier';
import { buildUser } from '../../../../../test/factories/user.factory';
import { createMockEmailVerificationTokensRepo } from '../../../../../test/factories/email-verification-token.factory';
import { TokenHash } from '../../domain/TokenHash';
import { EnvoiDeVerificationEmail } from './email-verification-dispatch';

function construire(base = 'https://asilidesign.fr/verify-email') {
  const tokensRepo = createMockEmailVerificationTokensRepo();
  const notifier: jest.Mocked<IEmailVerificationNotifier> = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  };
  const config = {
    get: jest.fn().mockReturnValue(base),
  } as unknown as ConfigService;
  const logger = new Logger('test');
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  return {
    tokensRepo,
    notifier,
    logger,
    envoi: new EnvoiDeVerificationEmail(tokensRepo, notifier, config),
  };
}

describe('EnvoiDeVerificationEmail', () => {
  const user = buildUser({ id: 'user-7', email: 'eve@example.com' });

  it('n enregistre que l empreinte du jeton envoye dans le lien', async () => {
    const { tokensRepo, notifier, logger, envoi } = construire();

    await envoi.envoyer(user, 'user-7', logger, 'Echec');

    const lien = new URL(
      notifier.sendVerificationEmail.mock.calls[0][0].verificationUrl,
    );
    const jetonBrut = lien.searchParams.get('token') ?? '';
    expect(jetonBrut).toMatch(/^[0-9a-f]{64}$/);
    expect(tokensRepo.create).toHaveBeenCalledWith({
      userId: 'user-7',
      tokenHash: TokenHash.fromRaw(jetonBrut).value,
      expiresAt: expect.any(Date) as Date,
    });
    expect(notifier.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'eve@example.com',
        verificationUrl: `https://asilidesign.fr/verify-email?token=${jetonBrut}`,
        expiresInMinutes: 1440,
      }),
    );
  });

  it('journalise l echec d envoi sans le propager', async () => {
    const { notifier, logger, envoi } = construire();
    notifier.sendVerificationEmail.mockRejectedValue(new Error('smtp'));

    await expect(
      envoi.envoyer(user, 'user-7', logger, 'Echec du renvoi'),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      'Echec du renvoi for eve@example.com: Error: smtp',
    );
  });
});
