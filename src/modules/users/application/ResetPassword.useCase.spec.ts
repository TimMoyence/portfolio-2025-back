/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';
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
import {
  attendreNouveauMotDePasseEnregistre,
  preparerNouveauMotDePasse,
} from '../../../../test/helpers/utilisateurs';

const CHOSEN_CREDENTIAL = 'NewPassword123!';
const ANY_VALID_CREDENTIAL = 'StrongPass1!';

describe('ResetPasswordUseCase', () => {
  let usersRepository: ReturnType<typeof createMockUsersRepo>;
  let tokensRepository: ReturnType<typeof createMockPasswordResetTokensRepo>;
  let passwordService: ReturnType<typeof createMockPasswordService>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    usersRepository = createMockUsersRepo();
    tokensRepository = createMockPasswordResetTokensRepo();
    passwordService = createMockPasswordService();

    useCase = new ResetPasswordUseCase(
      tokensRepository,
      usersRepository,
      passwordService,
    );
  });

  const attendreReinitialisationRefusee = (token: string) =>
    expect(
      useCase.execute({ token, newPassword: ANY_VALID_CREDENTIAL }),
    ).rejects.toBeInstanceOf(InvalidInputError);

  it('reinitialise le mot de passe avec un token valide', async () => {
    tokensRepository.findActiveByTokenHash.mockResolvedValue(
      buildPasswordResetToken({ id: 'token-1', userId: 'user-1' }),
    );
    preparerNouveauMotDePasse(usersRepository, passwordService, {
      passwordHash: 'old-hash',
    });

    const result = await useCase.execute({
      token: 'raw-token',
      newPassword: CHOSEN_CREDENTIAL,
    });

    attendreNouveauMotDePasseEnregistre(
      { hacher: passwordService.hash, mettreAJour: usersRepository.update },
      CHOSEN_CREDENTIAL,
      'password-reset',
    );
    expect(tokensRepository.markUsed).toHaveBeenCalledWith('token-1');
    expect(result.message).toContain('reinitialise');
  });

  it('rejette un token inconnu, expire ou deja utilise', async () => {
    tokensRepository.findActiveByTokenHash.mockResolvedValue(null);

    await attendreReinitialisationRefusee('invalid-token');

    expect(usersRepository.update).not.toHaveBeenCalled();
    expect(tokensRepository.markUsed).not.toHaveBeenCalled();
  });

  it('rejette quand le compte est introuvable ou inactif', async () => {
    tokensRepository.findActiveByTokenHash.mockResolvedValue(
      buildPasswordResetToken({ id: 'token-1', userId: 'user-404' }),
    );

    for (const compte of [null, buildUser({ id: 'user-1', isActive: false })]) {
      usersRepository.findById.mockResolvedValue(compte);
      await attendreReinitialisationRefusee('valid-token');
    }
  });
});
