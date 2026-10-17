import { messagesDuRefus } from '../../../../../test/helpers/validation-pipe';
import { ChangePasswordDto } from './ChangePassword.dto';
import { CreateUserDto } from './CreateUser.dto';
import { UpdateUserDto } from './UpdateUser.dto';

/* eslint-disable sonarjs/no-hardcoded-passwords -- fixtures de test, pas des secrets reels */
const CREATION = {
  email: 'jean@example.com',
  password: 'Motdepasse123!',
  firstName: 'Jean',
  lastName: 'Dupont',
};
const CHANGEMENT = {
  currentPassword: 'Ancien123!',
  newPassword: 'Nouveau1234!',
};
/* eslint-enable sonarjs/no-hardcoded-passwords */

describe('champs d un compte que le serveur fixe seul', () => {
  it.each([
    ['la création', 'updatedOrCreatedBy', CreateUserDto, CREATION],
    ['la mise à jour', 'updatedOrCreatedBy', UpdateUserDto, {}],
    [
      'le changement de mot de passe',
      'updatedOrCreatedBy',
      ChangePasswordDto,
      CHANGEMENT,
    ],
    ['le changement de mot de passe', 'userId', ChangePasswordDto, CHANGEMENT],
  ])(
    '%s refuse le champ %s envoyé par le client',
    async (_route, champ, dto, corps) => {
      await expect(
        messagesDuRefus(dto, { ...corps, [champ]: 'forge' }),
      ).resolves.toEqual([`property ${champ} should not exist`]);
    },
  );

  it.each([
    ['la création', CreateUserDto, CREATION],
    ['la mise à jour', UpdateUserDto, {}],
    ['le changement de mot de passe', ChangePasswordDto, CHANGEMENT],
  ])('%s accepte le corps sans ces champs', async (_route, dto, corps) => {
    await expect(messagesDuRefus(dto, corps)).resolves.toEqual([]);
  });
});
