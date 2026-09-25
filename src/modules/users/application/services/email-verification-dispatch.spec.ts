/* eslint-disable @typescript-eslint/unbound-method */
import type { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import type { IEmailVerificationNotifier } from '../../domain/IEmailVerificationNotifier';
import { buildUser } from '../../../../../test/factories/user.factory';
import { createMockEmailVerificationTokensRepo } from '../../../../../test/factories/email-verification-token.factory';
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

  it('enregistre un jeton puis envoie le lien qui le porte', async () => {
    const { tokensRepo, notifier, logger, envoi } = construire();

    await envoi.envoyer(user, 'user-7', logger, 'Echec');

    const jeton = tokensRepo.create.mock.calls[0][0].token;
    expect(tokensRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-7' }),
    );
    expect(notifier.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'eve@example.com',
        verificationUrl: `https://asilidesign.fr/verify-email?token=${jeton}`,
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
