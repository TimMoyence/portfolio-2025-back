/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildEmailVerificationToken,
  createMockEmailVerificationTokensRepo,
} from '../../../../test/factories/email-verification-token.factory';
import {
  buildUser,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';
import { createMockRefreshTokensRepo } from '../../../../test/factories/refresh-token.factory';
import { attendreMiseAJourDeLUtilisateur } from '../../../../test/helpers/utilisateurs';
import { LienInvalideError } from '../../../common/domain/errors/LienInvalideError';
import { DEFAULT_SELF_REGISTRATION_ROLES } from '../domain/roles';
import { TokenHash } from '../domain/TokenHash';
import { VerifyEmailUseCase } from './VerifyEmail.useCase';

describe('VerifyEmailUseCase', () => {
  function construire() {
    const tokensRepo = createMockEmailVerificationTokensRepo();
    const usersRepo = createMockUsersRepo();
    const refreshTokensRepo = createMockRefreshTokensRepo();
    return {
      tokensRepo,
      usersRepo,
      refreshTokensRepo,
      useCase: new VerifyEmailUseCase(tokensRepo, usersRepo, refreshTokensRepo),
    };
  }

  async function verifierUnCompteNonVerifie() {
    const depots = construire();
    depots.tokensRepo.findActiveByTokenHash.mockResolvedValue(
      buildEmailVerificationToken({ userId: 'user-1' }),
    );
    depots.usersRepo.findById.mockResolvedValue(
      buildUser({ id: 'user-1', emailVerified: false }),
    );
    await depots.useCase.execute('jeton-brut');
    return depots;
  }

  it('coupe les sessions ouvertes avant la vérification : l adresse vient d être prouvée, pas le compte', async () => {
    const { refreshTokensRepo } = await verifierUnCompteNonVerifie();

    expect(refreshTokensRepo.revokeByUserId).toHaveBeenCalledWith('user-1');
  });

  it('cherche le jeton par son empreinte, jamais par sa valeur brute', async () => {
    const { tokensRepo, usersRepo } = await verifierUnCompteNonVerifie();

    expect(tokensRepo.findActiveByTokenHash).toHaveBeenCalledWith(
      TokenHash.fromRaw('jeton-brut').value,
    );
    attendreMiseAJourDeLUtilisateur(usersRepo.update, {
      emailVerified: true,
      roles: [...DEFAULT_SELF_REGISTRATION_ROLES],
    });
    expect(tokensRepo.deleteByUserId).toHaveBeenCalledWith('user-1');
  });

  it('refuse un jeton inconnu ou expire comme tout lien invalide', async () => {
    const { tokensRepo, useCase } = construire();
    tokensRepo.findActiveByTokenHash.mockResolvedValue(null);

    await expect(useCase.execute('inconnu')).rejects.toBeInstanceOf(
      LienInvalideError,
    );
  });

  it('refuse un jeton dont le compte n existe plus comme tout lien invalide', async () => {
    const { tokensRepo, usersRepo, useCase } = construire();
    tokensRepo.findActiveByTokenHash.mockResolvedValue(
      buildEmailVerificationToken({ userId: 'user-supprime' }),
    );
    usersRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('jeton-brut')).rejects.toBeInstanceOf(
      LienInvalideError,
    );
    expect(usersRepo.update).not.toHaveBeenCalled();
  });
});
