import {
  FORMULAIRES_PUBLICS_A_ADRESSE,
  type FormulaireNomme,
} from '../../../../test/helpers/formulaires-publics';
import { champsRefuses } from '../../../../test/helpers/validation-pipe';
import { ForgotPasswordDto } from '../../../modules/users/interfaces/dto/ForgotPassword.dto';
import { LoginDto } from '../../../modules/users/interfaces/dto/Login.dto';
import { ResendVerificationDto } from '../../../modules/users/interfaces/dto/ResendVerification.dto';
import { InscriptionDto } from '../../../modules/users/interfaces/dto/Inscription.dto';
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

const INVISIBLES = [
  0x00a0, 0x2000, 0x200a, 0x200b, 0x2028, 0x2029, 0x202e, 0x202f, 0x3000,
  0xfeff, 0xe000,
].map((point) => String.fromCodePoint(point));

describe('AdresseEmail', () => {
  it.each([
    'jean@exemple.fr',
    'Jean.Dupont+cours@exemple.co.uk',
    "o'neil@exemple.fr",
    'élève@lycée.fr',
    'пример@почта.рф',
    'μαθητής@σχολείο.ελ',
    '用户@例子.广告',
    'jean@exemple.xn--p1ai',
    'jean@sous-domaine.exemple.fr',
    `${'a'.repeat(64)}@exemple.fr`,
    `jean@${'a'.repeat(63)}.fr`,
  ])('accepte %p a la saisie comme dans le domaine', (adresse) => {
    expect(jugements(adresse)).toEqual([true, true]);
  });

  it.each([
    '',
    'jean',
    '@exemple.fr',
    'jean@@exemple.fr',
    'jean@exemple.c',
    'jean@exemple.123',
    'jean@-x.fr',
    'jean@exemple-.fr',
    'jean@exe_mple.fr',
    'jean@ｅxemple.fr',
    'jean..dupont@exemple.fr',
    '.jean@exemple.fr',
    'jean.@exemple.fr',
    'jean @exemple.fr',
    'Jean Dupont <jean@exemple.fr>',
    'jean@gmail',
    'jean@localhost',
    'jean@127.0.0.1',
    'jean@[127.0.0.1]',
    `${'a'.repeat(65)}@exemple.fr`,
    `jean@${'a'.repeat(64)}.fr`,
    `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.fr`,
    '"jean"@exemple.fr',
    '"jean dupont"@exemple.fr',
    '"jean\r\nBcc: autre@exemple.fr"@exemple.fr',
    '"jean\u0001"@exemple.fr',
    ...INVISIBLES.flatMap((invisible) => [
      `jean${invisible}dupont@exemple.fr`,
      `jean@exe${invisible}mple.fr`,
    ]),
  ])('refuse %j a la saisie comme dans le domaine', (adresse) => {
    expect(jugements(adresse)).toEqual([false, false]);
  });

  it.each<FormulaireNomme>([
    ...FORMULAIRES_PUBLICS_A_ADRESSE,
    ['l inscription', InscriptionDto],
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
