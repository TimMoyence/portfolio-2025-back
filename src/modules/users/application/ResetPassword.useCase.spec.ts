/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
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

  it('reinitialise le mot de passe avec un token valide', async () => {
    const token = buildPasswordResetToken({ id: 'token-1', userId: 'user-1' });
    const user = buildUser({ id: 'user-1', passwordHash: 'old-hash' });
    const updatedUser = buildUser({ id: 'user-1', passwordHash: 'new-hash' });

    tokensRepository.findActiveByTokenHash.mockResolvedValue(token);
    usersRepository.findById.mockResolvedValue(user);
    passwordService.hash.mockResolvedValue('new-hash');
    usersRepository.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute({
      token: 'raw-token',
      newPassword: 'NewPassword123!',
    });

    expect(passwordService.hash).toHaveBeenCalledWith('NewPassword123!');
    expect(usersRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passwordHash: 'new-hash',
        updatedOrCreatedBy: 'password-reset',
      }),
    );
    expect(tokensRepository.markUsed).toHaveBeenCalledWith('token-1');
    expect(result.message).toContain('reinitialise');
  });

  it('rejette un token inconnu, expire ou deja utilise', async () => {
    tokensRepository.findActiveByTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ token: 'invalid-token', newPassword: 'StrongPass1!' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(usersRepository.update).not.toHaveBeenCalled();
    expect(tokensRepository.markUsed).not.toHaveBeenCalled();
  });

  it('rejette quand le compte est introuvable ou inactif', async () => {
    const token = buildPasswordResetToken({
      id: 'token-1',
      userId: 'user-404',
    });
    tokensRepository.findActiveByTokenHash.mockResolvedValue(token);
    usersRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ token: 'valid-token', newPassword: 'StrongPass1!' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    usersRepository.findById.mockResolvedValue(
      buildUser({ id: 'user-1', isActive: false }),
    );

    await expect(
      useCase.execute({ token: 'valid-token', newPassword: 'StrongPass1!' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
