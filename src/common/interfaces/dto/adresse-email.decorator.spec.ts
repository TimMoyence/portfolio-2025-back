import {
  FORMULAIRES_PUBLICS_A_ADRESSE,
  type FormulaireNomme,
} from '../../../../test/helpers/formulaires-publics';
import { champsRefuses } from '../../../../test/helpers/validation-pipe';
import { CreateUserDto } from '../../../modules/users/interfaces/dto/CreateUser.dto';
import { ForgotPasswordDto } from '../../../modules/users/interfaces/dto/ForgotPassword.dto';
import { LoginDto } from '../../../modules/users/interfaces/dto/Login.dto';
import { ResendVerificationDto } from '../../../modules/users/interfaces/dto/ResendVerification.dto';
import { UpdateUserDto } from '../../../modules/users/interfaces/dto/UpdateUser.dto';
import { EmailAddress } from '../../domain/value-objects/EmailAddress';
import { AdresseEmail } from './adresse-email.decorator';

class SaisieTemoin {
  @AdresseEmail()
  email: string;
}

const jugements = (adresse: string): [boolean, boolean] => [
  champsRefuses(SaisieTemoin, { email: adresse }).length === 0,
  EmailAddress.parse(adresse) !== null,
];

describe('AdresseEmail', () => {
  it.each([
    'jean@exemple.fr',
    'Jean.Dupont+cours@exemple.co.uk',
    "o'neil@exemple.fr",
    'élève@lycée.fr',
    'jean@exemple.xn--p1ai',
    `${'a'.repeat(64)}@exemple.fr`,
    `jean@${'a'.repeat(63)}.fr`,
  ])('accepte %p a la saisie comme dans le domaine', (adresse) => {
    expect(jugements(adresse)).toEqual([true, true]);
  });

  it.each([
    'jean@exemple.c',
    'jean@-x.fr',
    'jean@exemple-.fr',
    'jean@exe_mple.fr',
    'jean..dupont@exemple.fr',
    'jean@gmail',
    'jean@127.0.0.1',
    `${'a'.repeat(65)}@exemple.fr`,
    '"jean dupont"@exemple.fr',
    '"jean\r\nBcc: autre@exemple.fr"@exemple.fr',
    '"jean\u0001"@exemple.fr',
  ])('refuse %p a la saisie comme dans le domaine', (adresse) => {
    expect(jugements(adresse)).toEqual([false, false]);
  });

  it.each<FormulaireNomme>([
    ...FORMULAIRES_PUBLICS_A_ADRESSE,
    ['l inscription', CreateUserDto],
    ['la modification par l admin', UpdateUserDto],
    ['le mot de passe oublie', ForgotPasswordDto],
    ['la connexion', LoginDto],
    ['le renvoi de la verification', ResendVerificationDto],
  ])('porte la regle sur l adresse de %s', (_saisie, dto) => {
    expect(champsRefuses(dto, { email: 'jean@exemple.fr' })).not.toContain(
      'email',
    );
    expect(champsRefuses(dto, { email: '"jean dupont"@exemple.fr' })).toContain(
      'email',
    );
  });
});
