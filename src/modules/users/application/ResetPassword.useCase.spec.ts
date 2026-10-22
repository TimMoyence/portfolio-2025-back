/* eslint-disable @typescript-eslint/unbound-method */
import { LienInvalideError } from '../../../common/domain/errors/LienInvalideError';
import { emettreJeton } from '../../../common/domain/crypto/TokenHash';
import { ResetPasswordUseCase } from './ResetPassword.useCase';
import {
  buildUser,
  createMockPasswordService,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';
import {
  buildPasswordResetToken,
  createMockPasswordResetTokensRepo,
} from '../../../../test/factories/password-reset-token.factory';
import { createMockRefreshTokensRepo } from '../../../../test/factories/refresh-token.factory';
import {
  attendreAucunMotDePasseEnregistre,
  attendreNouveauMotDePasseEnregistre,
  preparerNouveauMotDePasse,
} from '../../../../test/helpers/utilisateurs';

const CHOSEN_CREDENTIAL = 'NewPassword123!';
const ANY_VALID_CREDENTIAL = 'StrongPass1!';
const JETON_EMIS = emettreJeton().brut;

describe('ResetPasswordUseCase', () => {
  let usersRepository: ReturnType<typeof createMockUsersRepo>;
  let tokensRepository: ReturnType<typeof createMockPasswordResetTokensRepo>;
  let passwordService: ReturnType<typeof createMockPasswordService>;
  let refreshTokensRepo: ReturnType<typeof createMockRefreshTokensRepo>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    usersRepository = createMockUsersRepo();
    tokensRepository = createMockPasswordResetTokensRepo();
    passwordService = createMockPasswordService();
    refreshTokensRepo = createMockRefreshTokensRepo();

    useCase = new ResetPasswordUseCase(
      usersRepository,
      passwordService,
      refreshTokensRepo,
      tokensRepository,
    );
  });

  const attendreReinitialisationRefusee = (token: string) =>
    expect(
      useCase.execute({ token, newPassword: ANY_VALID_CREDENTIAL }),
    ).rejects.toBeInstanceOf(LienInvalideError);

  const preparerUnLienValide = (
    titulaire: Parameters<typeof buildUser>[0] = { passwordHash: 'old-hash' },
  ) => {
    tokensRepository.findActiveByTokenHash.mockResolvedValue(
      buildPasswordResetToken({ id: 'token-1', userId: 'user-1' }),
    );
    preparerNouveauMotDePasse(usersRepository, passwordService, titulaire);
  };

  it.each<[string, Parameters<typeof buildUser>[0]]>([
    ['reinitialise le mot de passe avec un token valide', undefined],
    [
      'donne un mot de passe au titulaire Google qui n en avait pas, par le lien de sa tentative d inscription',
      { passwordHash: null, googleId: 'google-sub-1' },
    ],
  ])('%s', async (_cas, titulaire) => {
    preparerUnLienValide(titulaire);
    tokensRepository.markUsed.mockResolvedValue(true);

    const result = await useCase.execute({
      token: JETON_EMIS,
      newPassword: CHOSEN_CREDENTIAL,
    });

    attendreNouveauMotDePasseEnregistre(
      { passwordService, usersRepository, refreshTokensRepo },
      CHOSEN_CREDENTIAL,
      'password-reset',
    );
    expect(tokensRepository.markUsed).toHaveBeenCalledWith('token-1');
    expect(result.message).toContain('reinitialise');
    expect(result.userId).toBe('user-1');
  });

  it('refuse le lien qu un usage concurrent a deja consomme sans changer le mot de passe', async () => {
    preparerUnLienValide();
    tokensRepository.markUsed.mockResolvedValue(false);

    await attendreReinitialisationRefusee(JETON_EMIS);

    expect(tokensRepository.markUsed).toHaveBeenCalledWith('token-1');
    expect(passwordService.hash).not.toHaveBeenCalled();
    attendreAucunMotDePasseEnregistre(
      usersRepository.update,
      refreshTokensRepo.revokeByUserId,
    );
  });

  it('rejette un token inconnu, expire ou deja utilise', async () => {
    tokensRepository.findActiveByTokenHash.mockResolvedValue(null);

    await attendreReinitialisationRefusee(JETON_EMIS);

    expect(usersRepository.update).not.toHaveBeenCalled();
    expect(tokensRepository.markUsed).not.toHaveBeenCalled();
  });

  it('refuse un jeton qui n a pas la forme emise sans chercher au depot', async () => {
    await attendreReinitialisationRefusee('pas-un-jeton');

    expect(tokensRepository.findActiveByTokenHash).not.toHaveBeenCalled();
    expect(usersRepository.update).not.toHaveBeenCalled();
  });

  it('rejette quand le compte est introuvable ou inactif', async () => {
    tokensRepository.findActiveByTokenHash.mockResolvedValue(
      buildPasswordResetToken({ id: 'token-1', userId: 'user-404' }),
    );

    for (const compte of [null, buildUser({ id: 'user-1', isActive: false })]) {
      usersRepository.findById.mockResolvedValue(compte);
      await attendreReinitialisationRefusee(JETON_EMIS);
    }
  });
});
