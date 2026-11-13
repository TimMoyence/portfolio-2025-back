import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { UsersMapper } from '../application/mappers/UsersMapper';
import { User } from './User';

const PLAIN_CREDENTIAL = 'SecurePassword123!';
const COMPTE = {
  email: 'jane@mail.com',
  passwordHash: 'hash',
  firstName: 'Jane',
  lastName: 'Doe',
};

describe('Langue des emails du compte', () => {
  it('CPT-01 · garde la langue choisie a la creation du compte', () => {
    expect(User.create({ ...COMPTE, locale: 'en' }).locale).toBe('en');
  });

  it('CPT-02 · ecrit en francais a un compte cree sans langue', () => {
    expect(User.create(COMPTE).locale).toBe('fr');
  });

  it('CPT-01 · refuse une langue que le site ne sert pas', () => {
    expect(() =>
      User.create({ ...COMPTE, locale: 'de' as unknown as 'fr' }),
    ).toThrow(DomainValidationError);
  });

  it('CPT-01 · passe la langue de l inscription au compte cree', () => {
    const compte = UsersMapper.fromCreateCommand(
      {
        email: 'jane@mail.com',
        password: PLAIN_CREDENTIAL,
        firstName: 'Jane',
        lastName: 'Doe',
        locale: 'en',
      },
      'hash',
    );

    expect(compte.locale).toBe('en');
  });
});
