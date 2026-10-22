import { messagesDuRefus } from '../../../../../test/helpers/validation-pipe';
import { ChangePasswordDto } from './ChangePassword.dto';
import { InscriptionDto } from './Inscription.dto';

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
    ['l inscription', 'updatedOrCreatedBy', InscriptionDto, CREATION],
    ['l inscription', 'roles', InscriptionDto, CREATION],
    ['l inscription', 'isActive', InscriptionDto, CREATION],
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
    ['l inscription', InscriptionDto, CREATION],
    ['le changement de mot de passe', ChangePasswordDto, CHANGEMENT],
  ])('%s accepte le corps sans ces champs', async (_route, dto, corps) => {
    await expect(messagesDuRefus(dto, corps)).resolves.toEqual([]);
  });
});
