import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { User } from './User';

describe('User aggregate', () => {
  it('creates user with normalized email and phone', () => {
    const user = User.create({
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
    const partial = User.update({
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

  it('date la liaison d un compte Google', () => {
    expect(User.update({ googleId: 'google-sub-123' })).toEqual({
      googleId: 'google-sub-123',
      updatedAt: expect.any(Date) as Date,
    });
  });

  it('creates user with googleId and without passwordHash', () => {
    const user = User.create({
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      googleId: 'google-sub-123',
      roles: ['teacher'],
      updatedOrCreatedBy: 'google-oauth',
    });

    expect(user.email).toBe('google@example.com');
    expect(user.googleId).toBe('google-sub-123');
    expect(user.passwordHash).toBeNull();
    expect(user.roles).toEqual(['teacher']);
  });

  it('throws without googleId and without passwordHash', () => {
    expect(() =>
      User.create({
        email: 'nopwd@example.com',
        firstName: 'No',
        lastName: 'Password',
      }),
    ).toThrow(DomainValidationError);
  });

  it('throws for invalid user email', () => {
    expect(() =>
      User.create({
        email: 'invalid',
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
      }),
    ).toThrow(new DomainValidationError('Invalid user email'));
  });

  const COMPTE_A_MOT_DE_PASSE = {
    email: 'lea@example.com',
    passwordHash: 'hash',
    firstName: 'Lea',
    lastName: 'Martin',
  };

  it('accepte un prenom et un nom de 1 a 50 caracteres', () => {
    const court = User.create({
      ...COMPTE_A_MOT_DE_PASSE,
      firstName: ' L ',
      lastName: 'M',
    });
    const long = User.create({
      ...COMPTE_A_MOT_DE_PASSE,
      firstName: 'a'.repeat(50),
      lastName: 'b'.repeat(50),
    });

    expect([court.firstName, court.lastName]).toEqual(['L', 'M']);
    expect([long.firstName, long.lastName]).toEqual([
      'a'.repeat(50),
      'b'.repeat(50),
    ]);
    expect(User.update({ firstName: 'J', lastName: 'D' })).toMatchObject({
      firstName: 'J',
      lastName: 'D',
    });
  });

  it.each([
    ['firstName', 'Invalid user first name'],
    ['lastName', 'Invalid user last name'],
  ])(
    'refuse un %s vide ou de plus de 50 caracteres, a la creation comme a la mise a jour',
    (champ, message) => {
      for (const valeur of ['  ', 'a'.repeat(51), 42]) {
        expect(() =>
          User.create({ ...COMPTE_A_MOT_DE_PASSE, [champ]: valeur }),
        ).toThrow(new DomainValidationError(message));
        expect(() => User.update({ [champ]: valeur })).toThrow(
          new DomainValidationError(message),
        );
      }
    },
  );

  it('cree un compte Google sans nom quand Google n en donne pas', () => {
    const sansNom = User.create({
      email: 'google@example.com',
      firstName: 'Google',
      lastName: '',
      googleId: 'google-sub-123',
    });
    const nomAbsent = User.create({
      email: 'google@example.com',
      firstName: 'Google',
      lastName: undefined as unknown as string,
      googleId: 'google-sub-123',
    });

    expect(sansNom.lastName).toBe('');
    expect(nomAbsent.lastName).toBe('');
    expect(() =>
      User.create({
        email: 'google@example.com',
        firstName: 'Google',
        lastName: 'b'.repeat(51),
        googleId: 'google-sub-123',
      }),
    ).toThrow(new DomainValidationError('Invalid user last name'));
  });

  it('normalise le telephone et nomme le champ d un telephone invalide', () => {
    expect(
      User.create({ ...COMPTE_A_MOT_DE_PASSE, phone: ' 06 12 34 56 78 ' })
        .phone,
    ).toBe('0612345678');
    expect(() =>
      User.create({ ...COMPTE_A_MOT_DE_PASSE, phone: 'abc' }),
    ).toThrow(new DomainValidationError('Invalid user phone number'));
    expect(() => User.update({ phone: 'abc' })).toThrow(
      new DomainValidationError('Invalid user phone number'),
    );
  });

  it('nomme le drapeau qui n est pas booleen a la mise a jour', () => {
    expect(() =>
      User.update({ isActive: 'true' as unknown as boolean }),
    ).toThrow(new DomainValidationError('Invalid user active flag'));
    expect(() =>
      User.update({ emailVerified: 'true' as unknown as boolean }),
    ).toThrow(new DomainValidationError('Invalid email verified flag'));
  });
});
