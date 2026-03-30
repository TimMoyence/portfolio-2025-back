import { BadRequestException } from '@nestjs/common';
import type { CreateUserCommand } from '../dto/CreateUser.command';
import type { UpdateUserCommand } from '../dto/UpdateUser.command';
import { UsersMapper } from './UsersMapper';

describe('UsersMapper', () => {
  const baseCreateCommand: CreateUserCommand = {
    email: 'john@example.com',
    password: 'StrongPassword123!',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('normalizes email and phone on create', () => {
    const mapped = UsersMapper.fromCreateCommand(
      {
        ...baseCreateCommand,
        email: '  JOHN.DOE@Example.com ',
        phone: '00 1 212 555 0100',
      },
      'hashed-password',
    );

    expect(mapped.email).toBe('john.doe@example.com');
    expect(mapped.phone).toBe('+12125550100');
    expect(mapped.passwordHash).toBe('hashed-password');
  });

  it('throws when create email or phone is invalid', () => {
    expect(() =>
      UsersMapper.fromCreateCommand(
        {
          ...baseCreateCommand,
          email: 'invalid',
        },
        'hash',
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      UsersMapper.fromCreateCommand(
        {
          ...baseCreateCommand,
          phone: 'invalid-phone',
        },
        'hash',
      ),
    ).toThrow(BadRequestException);
  });

  it('normalizes and maps partial fields on update', () => {
    const command: UpdateUserCommand = {
      email: '  Jane.Doe@Example.com ',
      phone: '  ',
      isActive: false,
    };

    const mapped = UsersMapper.fromUpdateCommand(command);

    expect(mapped.email).toBe('jane.doe@example.com');
    expect(mapped.phone).toBeNull();
    expect(mapped.isActive).toBe(false);
    expect(mapped.updatedAt).toBeInstanceOf(Date);
  });

  it('throws when update phone is provided and invalid', () => {
    expect(() =>
      UsersMapper.fromUpdateCommand({
        phone: 'invalid',
      }),
    ).toThrow(BadRequestException);
  });
});
