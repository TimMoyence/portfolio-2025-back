/* eslint-disable @typescript-eslint/unbound-method */
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import { SetPasswordUseCase } from './SetPassword.useCase';
import {
  buildUser,
  createMockPasswordService,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';

const CHOSEN_CREDENTIAL = 'NewPassword123!';
const EXISTING_HASH = 'existing-hash';

describe('SetPasswordUseCase', () => {
  let usersRepository: ReturnType<typeof createMockUsersRepo>;
  let passwordService: ReturnType<typeof createMockPasswordService>;
  let useCase: SetPasswordUseCase;

  beforeEach(() => {
    usersRepository = createMockUsersRepo();
    passwordService = createMockPasswordService();
    useCase = new SetPasswordUseCase(usersRepository, passwordService);
  });

  it('autorise un compte Google-only a definir un mot de passe', async () => {
    const user = buildUser({ id: 'user-1', passwordHash: null });
    const updatedUser = buildUser({ id: 'user-1', passwordHash: 'new-hash' });

    usersRepository.findById.mockResolvedValue(user);
    passwordService.hash.mockResolvedValue('new-hash');
    usersRepository.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute({
      userId: 'user-1',
      newPassword: CHOSEN_CREDENTIAL,
      updatedOrCreatedBy: 'self-service',
    });

    expect(passwordService.hash).toHaveBeenCalledWith(CHOSEN_CREDENTIAL);
    expect(usersRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passwordHash: 'new-hash',
        updatedOrCreatedBy: 'self-service',
      }),
    );
    expect(result).toEqual(updatedUser);
  });

  it('rejette un compte avec mot de passe deja configure', async () => {
    usersRepository.findById.mockResolvedValue(
      buildUser({ id: 'user-1', passwordHash: EXISTING_HASH }),
    );

    await expect(
      useCase.execute({ userId: 'user-1', newPassword: CHOSEN_CREDENTIAL }),
    ).rejects.toBeInstanceOf(ResourceConflictError);

    expect(usersRepository.update).not.toHaveBeenCalled();
  });

  it('rejette un compte inactif ou inexistant', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'missing', newPassword: CHOSEN_CREDENTIAL }),
    ).rejects.toBeInstanceOf(UserNotFoundError);

    usersRepository.findById.mockResolvedValue(
      buildUser({ id: 'user-1', isActive: false, passwordHash: null }),
    );

    await expect(
      useCase.execute({ userId: 'user-1', newPassword: CHOSEN_CREDENTIAL }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
