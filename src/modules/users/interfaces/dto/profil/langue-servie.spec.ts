import { buildUser } from '../../../../../../test/factories/comptes/user.factory';
import { UserResponseDto } from './User.response.dto';

describe('Langue des emails servie avec le compte', () => {
  it.each(['en', 'fr'] as const)(
    'CPT-03 · sert la langue %s des emails du compte',
    (locale) => {
      expect(UserResponseDto.fromDomain(buildUser({ locale })).locale).toBe(
        locale,
      );
    },
  );
});
