import { BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '../dto/CreateUser.dto';
import { UpdateUserDto } from '../dto/UpdateUser.dto';
import { UsersMapper } from './UsersMapper';

describe('UsersMapper', () => {
  const baseCreateDto: CreateUserDto = {
    email: 'john@example.com',
    password: 'StrongPassword123!',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('normalizes email and phone on create', () => {
    const mapped = UsersMapper.fromCreateDto(
      {
        ...baseCreateDto,
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
      UsersMapper.fromCreateDto(
        {
          ...baseCreateDto,
          email: 'invalid',
        },
        'hash',
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      UsersMapper.fromCreateDto(
        {
          ...baseCreateDto,
          phone: 'invalid-phone',
        },
        'hash',
      ),
    ).toThrow(BadRequestException);
  });

  it('normalizes and maps partial fields on update', () => {
    const dto: UpdateUserDto = {
      email: '  Jane.Doe@Example.com ',
      phone: '  ',
      isActive: false,
    };

    const mapped = UsersMapper.fromUpdateDto(dto);

    expect(mapped.email).toBe('jane.doe@example.com');
    expect(mapped.phone).toBeNull();
    expect(mapped.isActive).toBe(false);
    expect(mapped.updatedAt).toBeInstanceOf(Date);
  });

  it('throws when update phone is provided and invalid', () => {
    expect(() =>
      UsersMapper.fromUpdateDto({
        phone: 'invalid',
      }),
    ).toThrow(BadRequestException);
  });
});
