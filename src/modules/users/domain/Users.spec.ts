import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { Users } from './Users';

describe('Users aggregate', () => {
  it('creates user with normalized email and phone', () => {
    const user = Users.create({
      email: '  JOHN.DOE@Example.com ',
      passwordHash: 'hash',
      firstName: ' John ',
      lastName: ' Doe ',
      phone: '00 1 212 555 0100',
      isActive: true,
      roles: [],
      updatedOrCreatedBy: ' system ',
    });

    expect(user.email).toBe('john.doe@example.com');
    expect(user.phone).toBe('+12125550100');
    expect(user.firstName).toBe('John');
    expect(user.lastName).toBe('Doe');
    expect(user.updatedOrCreatedBy).toBe('system');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('builds normalized partial update', () => {
    const partial = Users.update({
      email: '  jane.doe@Example.com ',
      phone: '  ',
      isActive: false,
      updatedOrCreatedBy: ' ',
    });

    expect(partial.email).toBe('jane.doe@example.com');
    expect(partial.phone).toBeNull();
    expect(partial.isActive).toBe(false);
    expect(partial.updatedOrCreatedBy).toBeNull();
    expect(partial.updatedAt).toBeInstanceOf(Date);
  });

  it('creates user with googleId and without passwordHash', () => {
    const user = Users.create({
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      googleId: 'google-sub-123',
      roles: ['budget'],
      updatedOrCreatedBy: 'google-oauth',
    });

    expect(user.email).toBe('google@example.com');
    expect(user.googleId).toBe('google-sub-123');
    expect(user.passwordHash).toBeNull();
    expect(user.roles).toEqual(['budget']);
  });

  it('throws without googleId and without passwordHash', () => {
    expect(() =>
      Users.create({
        email: 'nopwd@example.com',
        firstName: 'No',
        lastName: 'Password',
      }),
    ).toThrow(DomainValidationError);
  });

  it('throws for invalid user email', () => {
    expect(() =>
      Users.create({
        email: 'invalid',
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
      }),
    ).toThrow(DomainValidationError);
  });
});
