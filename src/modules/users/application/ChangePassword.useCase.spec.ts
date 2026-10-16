/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { MotDePasseActuelIncorrectError } from '../domain/MotDePasseActuelIncorrectError';
import type { User } from '../domain/User';
import { ChangePasswordUseCase } from './ChangePassword.useCase';
import type { ChangePasswordCommand } from './dto/ChangePassword.command';
import type { PasswordService } from './services/PasswordService';
import {
  buildUser,
  createMockUsersRepo,
  createMockPasswordService,
} from '../../../../test/factories/user.factory';
import { createMockRefreshTokensRepo } from '../../../../test/factories/refresh-token.factory';
import {
  attendreAucunMotDePasseEnregistre,
  attendreNouveauMotDePasseEnregistre,
} from '../../../../test/helpers/utilisateurs';

const CURRENT_CREDENTIAL = 'OldPassword123';
const NEXT_CREDENTIAL = 'NewPassword456';

describe('ChangePasswordUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let refreshTokensRepo: ReturnType<typeof createMockRefreshTokensRepo>;
  let useCase: ChangePasswordUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    passwordService = createMockPasswordService();
    passwordService.hash.mockResolvedValue('new-hash');
    passwordService.verify.mockResolvedValue(true);
    refreshTokensRepo = createMockRefreshTokensRepo();

    useCase = new ChangePasswordUseCase(
      repo,
      passwordService,
      refreshTokensRepo,
    );
  });

  it('changes the password when current password matches', async () => {
    const user = buildUser({
      email: 'john@example.com',
      passwordHash: 'old-hash',
      firstName: 'John',
      lastName: 'Doe',
      updatedOrCreatedBy: 'system',
    });
    repo.findById.mockResolvedValue(user);

    const updatedUser = { ...user, passwordHash: 'new-hash' } as User;
    repo.update.mockResolvedValue(updatedUser);

    const dto: ChangePasswordCommand = {
      userId: 'user-1',
      currentPassword: CURRENT_CREDENTIAL,
      newPassword: NEXT_CREDENTIAL,
    };

    const result = await useCase.execute(dto);

    expect(passwordService.verify).toHaveBeenCalledWith(
      dto.currentPassword,
      user.passwordHash,
    );
    attendreNouveauMotDePasseEnregistre(
      { passwordService, usersRepository: repo, refreshTokensRepo },
      dto.newPassword,
      'password-change',
    );
    expect(result).toBe(updatedUser);
  });

  it('throws when user is not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'missing',
        currentPassword: 'old',
        newPassword: 'new',
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('throws when current password is invalid', async () => {
    const user = buildUser({
      email: 'john@example.com',
      passwordHash: 'old-hash',
      firstName: 'John',
      lastName: 'Doe',
    });
    repo.findById.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(false);

    const refus = useCase.execute({
      userId: 'user-1',
      currentPassword: 'wrong',
      newPassword: 'new',
    });

    await expect(refus).rejects.toBeInstanceOf(MotDePasseActuelIncorrectError);
    await expect(refus).rejects.toBeInstanceOf(InvalidInputError);
    attendreAucunMotDePasseEnregistre(
      repo.update,
      refreshTokensRepo.revokeByUserId,
    );
  });

  const attendreUnRefusAvantLaVerification = async (
    compte: User,
    erreur: new (...args: never[]) => Error,
  ) => {
    repo.findById.mockResolvedValue(compte);

    await expect(
      useCase.execute({
        userId: compte.id ?? '',
        currentPassword: 'whatever',
        newPassword: 'new-pass',
      }),
    ).rejects.toBeInstanceOf(erreur);
    expect(passwordService.verify).not.toHaveBeenCalled();
    attendreAucunMotDePasseEnregistre(
      repo.update,
      refreshTokensRepo.revokeByUserId,
    );
  };

  it('refuse par un conflit, et non comme une session perdue, un compte qui n a pas de mot de passe', async () => {
    await attendreUnRefusAvantLaVerification(
      buildUser({ passwordHash: null }),
      ResourceConflictError,
    );
  });

  it('rejects inactive users even if the password matches', async () => {
    const inactiveUser = buildUser({
      id: 'user-2',
      email: 'inactive@example.com',
      passwordHash: 'hash',
      firstName: 'Ina',
      lastName: 'Ctive',
      isActive: false,
      updatedOrCreatedBy: 'system',
    });

    await attendreUnRefusAvantLaVerification(
      inactiveUser,
      InvalidCredentialsError,
    );
  });
});
