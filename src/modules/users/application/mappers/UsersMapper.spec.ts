import { BadRequestException } from '@nestjs/common';
import type { CreateUserCommand } from '../dto/CreateUser.command';
import { UsersMapper } from './UsersMapper';

const PLAIN_CREDENTIAL = 'StrongPassword123!';

describe('UsersMapper', () => {
  const baseCreateCommand: CreateUserCommand = {
    email: 'john@example.com',
    password: PLAIN_CREDENTIAL,
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

  it('ne met à jour que les champs du profil, signés par leur titulaire', () => {
    const mapped = UsersMapper.fromProfileCommand({
      firstName: '  Jane ',
      phone: '  ',
    });

    expect(mapped).toEqual({
      firstName: 'Jane',
      phone: null,
      updatedOrCreatedBy: 'self-update',
      updatedAt: expect.any(Date),
    });
  });

  it('throws when update phone is provided and invalid', () => {
    expect(() =>
      UsersMapper.fromProfileCommand({
        phone: 'invalid',
      }),
    ).toThrow(BadRequestException);
  });

  it('creates a domain user from Google OAuth data', () => {
    const user = UsersMapper.fromGoogleAuth({
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      googleId: 'google-sub-456',
      roles: ['admin', 'teacher'],
    });

    expect(user.email).toBe('google@example.com');
    expect(user.firstName).toBe('Google');
    expect(user.lastName).toBe('User');
    expect(user.googleId).toBe('google-sub-456');
    expect(user.passwordHash).toBeNull();
    expect(user.roles).toEqual(['admin', 'teacher']);
    expect(user.updatedOrCreatedBy).toBe('google-oauth');
  });
});
