import { UsersController } from './Users.controller';
import type { ListUsersUseCase } from '../application/ListUsers.useCase';
import type { ListOneUserUseCase } from '../application/ListOneUser.useCase';
import type { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import type { UpdateUsersUseCase } from '../application/UpdateUsers.useCase';
import type { DeleteUsersUseCase } from '../application/DeleteUsers.useCase';
import { buildUser } from '../../../../test/factories/user.factory';
import {
  createMockUsersUseCases,
  type MockUsersUseCases,
} from '../../../../test/factories/user.factory';

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

  // --- findAll ---

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

  it('devrait mapper correctement les champs du UserResponseDto', async () => {
    const user = buildUser({
      roles: ['admin', 'budget'],
      phone: '+33612345678',
    });
    useCases.listUsers.execute.mockResolvedValue([user]);

    const result = await controller.findAll();

    expect(result[0].email).toBe(user.email);
    expect(result[0].firstName).toBe(user.firstName);
    expect(result[0].lastName).toBe(user.lastName);
    expect(result[0].phone).toBe('+33612345678');
    expect(result[0].roles).toEqual(['admin', 'budget']);
    expect(result[0].isActive).toBe(true);
    expect(result[0].hasPassword).toBe(true);
  });

  it('devrait retourner hasPassword=false pour un user sans mot de passe', async () => {
    const user = buildUser({ passwordHash: '' });
    useCases.listUsers.execute.mockResolvedValue([user]);

    const result = await controller.findAll();

    expect(result[0].hasPassword).toBe(false);
  });

  // --- findOne ---

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

  // --- create ---

  it('devrait deleguer create au use case CreateUsers', async () => {
    const user = buildUser();
    useCases.createUsers.execute.mockResolvedValue(user);

    const dto = {
      email: 'new@example.com',
      password: 'StrongPass123!',
      firstName: 'Marie',
      lastName: 'Curie',
    };

    const result = await controller.create(dto);

    expect(useCases.createUsers.execute).toHaveBeenCalledWith(dto);
    expect(result.id).toBe(user.id);
  });

  // --- update ---

  it('devrait deleguer update au use case UpdateUsers avec id et dto', async () => {
    const user = buildUser({ firstName: 'Pierre' });
    useCases.updateUsers.execute.mockResolvedValue(user);

    const dto = { firstName: 'Pierre' };
    const result = await controller.update('user-1', dto);

    expect(useCases.updateUsers.execute).toHaveBeenCalledWith('user-1', dto);
    expect(result.firstName).toBe('Pierre');
  });

  // --- delete ---

  it('devrait deleguer delete au use case DeleteUsers', async () => {
    const user = buildUser({ isActive: false });
    useCases.deleteUsers.execute.mockResolvedValue(user);

    const result = await controller.delete('user-1');

    expect(useCases.deleteUsers.execute).toHaveBeenCalledWith('user-1');
    expect(result.isActive).toBe(false);
  });

  // --- Propagation d'erreurs ---

  it('devrait propager UserNotFoundError du use case update', async () => {
    const error = new Error('User with id user-999 was not found');
    error.name = 'UserNotFoundError';
    useCases.updateUsers.execute.mockRejectedValue(error);

    await expect(
      controller.update('user-999', { firstName: 'Ghost' }),
    ).rejects.toThrow('User with id user-999 was not found');
  });

  it('devrait propager UserNotFoundError du use case delete', async () => {
    const error = new Error('User with id user-999 was not found');
    error.name = 'UserNotFoundError';
    useCases.deleteUsers.execute.mockRejectedValue(error);

    await expect(controller.delete('user-999')).rejects.toThrow(
      'User with id user-999 was not found',
    );
  });
});
