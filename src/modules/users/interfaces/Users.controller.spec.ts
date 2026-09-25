import { UsersController } from './Users.controller';
import type { ListUsersUseCase } from '../application/ListUsers.useCase';
import type { ListOneUserUseCase } from '../application/ListOneUser.useCase';
import type { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import type { UpdateUsersUseCase } from '../application/UpdateUsers.useCase';
import type { DeleteUsersUseCase } from '../application/DeleteUsers.useCase';
import type { User } from '../domain/User';
import {
  buildUser,
  createMockUsersUseCases,
  type MockUsersUseCases,
} from '../../../../test/factories/user.factory';

const PLAIN_CREDENTIAL = 'StrongPass123!';

describe('UsersController', () => {
  let controller: UsersController;
  let useCases: MockUsersUseCases;

  beforeEach(() => {
    useCases = createMockUsersUseCases();

    controller = new UsersController(
      useCases.listUsers as unknown as ListUsersUseCase,
      useCases.listOneUser as unknown as ListOneUserUseCase,
      useCases.createUsers as unknown as CreateUsersUseCase,
      useCases.updateUsers as unknown as UpdateUsersUseCase,
      useCases.deleteUsers as unknown as DeleteUsersUseCase,
    );
  });

  it('devrait deleguer findAll au use case ListUsers', async () => {
    const users = [
      buildUser(),
      buildUser({ id: 'user-2', email: 'other@example.com' }),
    ];
    useCases.listUsers.execute.mockResolvedValue(users);

    const result = await controller.findAll();

    expect(useCases.listUsers.execute).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('user-1');
    expect(result[1].id).toBe('user-2');
  });

  const listerUnSeul = async (user: User) => {
    useCases.listUsers.execute.mockResolvedValue([user]);
    const [premier] = await controller.findAll();
    return premier;
  };

  it('devrait mapper correctement les champs du UserResponseDto', async () => {
    const user = buildUser({
      roles: ['admin', 'teacher'],
      phone: '+33612345678',
    });

    const dto = await listerUnSeul(user);

    expect(dto.email).toBe(user.email);
    expect(dto.firstName).toBe(user.firstName);
    expect(dto.lastName).toBe(user.lastName);
    expect(dto.phone).toBe('+33612345678');
    expect(dto.roles).toEqual(['admin', 'teacher']);
    expect(dto.isActive).toBe(true);
    expect(dto.hasPassword).toBe(true);
  });

  it('devrait retourner hasPassword=false pour un user sans mot de passe', async () => {
    const dto = await listerUnSeul(buildUser({ passwordHash: '' }));

    expect(dto.hasPassword).toBe(false);
  });

  it('devrait deleguer findOne au use case ListOneUser', async () => {
    const user = buildUser();
    useCases.listOneUser.execute.mockResolvedValue(user);

    const result = await controller.findOne('user-1');

    expect(useCases.listOneUser.execute).toHaveBeenCalledWith('user-1');
    expect(result?.id).toBe('user-1');
    expect(result?.email).toBe('test@example.com');
  });

  it('devrait retourner null si le user est introuvable', async () => {
    useCases.listOneUser.execute.mockResolvedValue(null);

    const result = await controller.findOne('user-999');

    expect(result).toBeNull();
  });

  it('devrait deleguer create au use case CreateUsers', async () => {
    const user = buildUser();
    useCases.createUsers.execute.mockResolvedValue({
      user,
    });

    const dto = {
      email: 'new@example.com',
      password: PLAIN_CREDENTIAL,
      firstName: 'Marie',
      lastName: 'Curie',
    };

    const result = await controller.create(dto);

    expect(useCases.createUsers.execute).toHaveBeenCalledWith(dto);
    expect(result.id).toBe(user.id);
  });

  it('devrait deleguer update au use case UpdateUsers avec id et dto', async () => {
    const user = buildUser({ firstName: 'Pierre' });
    useCases.updateUsers.execute.mockResolvedValue(user);

    const dto = { firstName: 'Pierre' };
    const result = await controller.update('user-1', dto);

    expect(useCases.updateUsers.execute).toHaveBeenCalledWith('user-1', dto);
    expect(result.firstName).toBe('Pierre');
  });

  it('devrait deleguer delete au use case DeleteUsers', async () => {
    const user = buildUser({ isActive: false });
    useCases.deleteUsers.execute.mockResolvedValue(user);

    const result = await controller.delete('user-1');

    expect(useCases.deleteUsers.execute).toHaveBeenCalledWith('user-1');
    expect(result.isActive).toBe(false);
  });

  it.each([
    [
      'update',
      () => useCases.updateUsers,
      () => controller.update('user-999', { firstName: 'Ghost' }),
    ],
    ['delete', () => useCases.deleteUsers, () => controller.delete('user-999')],
  ])(
    'devrait propager UserNotFoundError du use case %s',
    async (_action, useCase, appeler) => {
      const error = new Error('User with id user-999 was not found');
      error.name = 'UserNotFoundError';
      useCase().execute.mockRejectedValue(error);

      await expect(appeler()).rejects.toThrow(
        'User with id user-999 was not found',
      );
    },
  );
});
