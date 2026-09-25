/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import type { User } from '../domain/User';
import type { UpdateProfileCommand } from './dto/UpdateProfile.command';
import { UpdateProfileUseCase } from './UpdateProfile.useCase';
import {
  createMockUsersRepo,
  buildUser,
} from '../../../../test/factories/user.factory';
import {
  attendreMiseAJourDeLUtilisateur,
  attendreUtilisateurIntrouvable,
} from '../../../../test/helpers/utilisateurs';

describe('UpdateProfileUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let useCase: UpdateProfileUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    useCase = new UpdateProfileUseCase(repo);
  });

  const mettreAJour = async (
    existant: Partial<User>,
    command: UpdateProfileCommand,
  ) => {
    repo.findById.mockResolvedValue(buildUser({ id: 'user-1', ...existant }));
    const updatedUser = buildUser({ id: 'user-1', ...command });
    repo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute('user-1', command);

    attendreMiseAJourDeLUtilisateur(repo.update, {
      ...command,
      updatedOrCreatedBy: 'self-update',
    });
    expect(result).toBe(updatedUser);
  };

  it('devrait mettre a jour le profil quand l utilisateur existe', async () => {
    await mettreAJour(
      { firstName: 'Jean' },
      { firstName: 'Pierre', lastName: 'Martin' },
    );

    expect(repo.findById).toHaveBeenCalledWith('user-1');
  });

  it.each([
    ['devrait mettre a jour uniquement le telephone', null, '+33612345678'],
    ['devrait permettre de mettre le telephone a null', '+33612345678', null],
  ])('%s', async (_titre, telephoneExistant, phone) => {
    await mettreAJour({ phone: telephoneExistant }, { phone });
  });

  it('devrait lever UserNotFoundError quand l utilisateur n existe pas', async () => {
    await attendreUtilisateurIntrouvable(
      repo,
      () => useCase.execute('missing-id', { firstName: 'Test' }),
      repo.update,
    );
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
