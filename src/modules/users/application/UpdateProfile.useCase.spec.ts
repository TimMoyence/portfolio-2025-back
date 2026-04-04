/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import type { IUsersRepository } from '../domain/IUsers.repository';
import type { UpdateProfileCommand } from './dto/UpdateProfile.command';
import { UpdateProfileUseCase } from './UpdateProfile.useCase';
import {
  createMockUsersRepo,
  buildUser,
} from '../../../../test/factories/user.factory';

describe('UpdateProfileUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let useCase: UpdateProfileUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    useCase = new UpdateProfileUseCase(repo);
  });

  it('devrait mettre a jour le profil quand l utilisateur existe', async () => {
    const user = buildUser({ id: 'user-1', firstName: 'Jean' });
    repo.findById.mockResolvedValue(user);

    const command: UpdateProfileCommand = {
      firstName: 'Pierre',
      lastName: 'Martin',
    };

    const updatedUser = buildUser({
      id: 'user-1',
      firstName: 'Pierre',
      lastName: 'Martin',
    });
    repo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute('user-1', command);

    expect(repo.findById).toHaveBeenCalledWith('user-1');
    expect(repo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        firstName: 'Pierre',
        lastName: 'Martin',
        updatedOrCreatedBy: 'self-update',
        updatedAt: expect.any(Date),
      }),
    );
    expect(result).toBe(updatedUser);
  });

  it('devrait mettre a jour uniquement le telephone', async () => {
    const user = buildUser({ id: 'user-1' });
    repo.findById.mockResolvedValue(user);

    const command: UpdateProfileCommand = { phone: '+33612345678' };
    const updatedUser = buildUser({ id: 'user-1', phone: '+33612345678' });
    repo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute('user-1', command);

    expect(repo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        phone: '+33612345678',
        updatedOrCreatedBy: 'self-update',
      }),
    );
    expect(result).toBe(updatedUser);
  });

  it('devrait permettre de mettre le telephone a null', async () => {
    const user = buildUser({ id: 'user-1', phone: '+33612345678' });
    repo.findById.mockResolvedValue(user);

    const command: UpdateProfileCommand = { phone: null };
    const updatedUser = buildUser({ id: 'user-1', phone: null });
    repo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute('user-1', command);

    expect(repo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        phone: null,
        updatedOrCreatedBy: 'self-update',
      }),
    );
    expect(result).toBe(updatedUser);
  });

  it('devrait lever UserNotFoundError quand l utilisateur n existe pas', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('missing-id', { firstName: 'Test' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('devrait lever BadRequestException pour un telephone invalide', async () => {
    const user = buildUser({ id: 'user-1' });
    repo.findById.mockResolvedValue(user);

    const command: UpdateProfileCommand = { phone: 'not-a-phone' };

    await expect(useCase.execute('user-1', command)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(repo.update).not.toHaveBeenCalled();
  });
});
