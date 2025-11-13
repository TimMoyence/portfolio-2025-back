import { NotFoundException } from '@nestjs/common';
import { IUsersRepository } from '../domain/IUsers.repository';
import { Users } from '../domain/Users';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { PasswordService } from './services/PasswordService';
import { UpdateUsersUseCase } from './UpdateUsers.useCase';

describe('UpdateUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let useCase: UpdateUsersUseCase;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };
    passwordService = {
      hash: jest.fn().mockReturnValue('new-hash'),
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;
    useCase = new UpdateUsersUseCase(repo, passwordService);
  });

  it('updates the user when it exists', async () => {
    const user: Users = {
      id: 'user-1',
      email: 'john@example.com',
      passwordHash: 'hash',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedOrCreatedBy: null,
    };
    repo.findById.mockResolvedValue(user);

    const dto: UpdateUserDto = {
      firstName: 'Johnny',
      phone: '123456789',
    };

    const updatedUser = { ...user, ...dto } as Users;
    repo.update.mockResolvedValue(updatedUser);

    const result = await useCase.execute('user-1', dto);

    expect(repo.findById).toHaveBeenCalledWith('user-1');
    expect(repo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        firstName: dto.firstName,
        phone: dto.phone,
        updatedAt: expect.any(Date),
      }),
    );
    expect(result).toBe(updatedUser);
  });

  it('throws when the user does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('missing', {} as UpdateUserDto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
