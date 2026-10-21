import {
  champsRefuses,
  messagesDeRefus,
  saisieRetenue,
} from '../../../../../test/helpers/validation-pipe';
import { User } from '../../domain/User';
import { ChangePasswordDto } from './ChangePassword.dto';
import { InscriptionDto } from './Inscription.dto';
import { LoginDto } from './Login.dto';
import { MotDePasseRobuste } from './regles-de-saisie';
import { ResetPasswordDto } from './ResetPassword.dto';
import { SetPasswordDto } from './SetPassword.dto';
import { UpdateProfileDto } from './UpdateProfile.dto';

describe('prenom et nom d un compte', () => {
  const secretRobuste = 'StrongPassword123!';
  const inscription = {
    email: 'lea@example.com',
    password: secretRobuste,
    firstName: 'Lea',
    lastName: 'Martin',
  };

  it.each([
    ['l inscription', InscriptionDto, inscription],
    ['le profil', UpdateProfileDto, {}],
  ])(
    'acceptent 1 a 50 caracteres et refusent un texte vide ou plus long a %s',
    (_saisie, dto: new () => object, base) => {
      const refusesPour = (valeur: string) =>
        champsRefuses(dto, { ...base, firstName: valeur, lastName: valeur });

      expect(['L', 'a'.repeat(50)].map(refusesPour)).toEqual([[], []]);
      expect(['', 'a'.repeat(51)].map(refusesPour)).toEqual([
        ['firstName', 'lastName'],
        ['firstName', 'lastName'],
      ]);
    },
  );

  it.each([
    ['30 emoji', String.fromCodePoint(0x1f600).repeat(30)],
    ['50 emoji', String.fromCodePoint(0x1f600).repeat(50)],
    ['51 emoji', String.fromCodePoint(0x1f600).repeat(51)],
    ['des blancs seuls', '   '],
    ['50 lettres entourees de blancs', ` ${'a'.repeat(50)} `],
    ['51 lettres', 'a'.repeat(51)],
  ])(
    'jugent %s comme le domaine, a l inscription et au profil',
    (_cas, nom) => {
      const leDomaineGarde = (): string | null => {
        try {
          return User.update({ firstName: nom }).firstName ?? null;
        } catch {
          return null;
        }
      };

      expect([
        saisieRetenue(InscriptionDto, { ...inscription, firstName: nom })
          ?.firstName ?? null,
        saisieRetenue(UpdateProfileDto, { firstName: nom })?.firstName ?? null,
      ]).toEqual([leDomaineGarde(), leDomaineGarde()]);
    },
  );

  it('refusent des blancs seuls avec le message de la saisie', () => {
    expect(messagesDeRefus(UpdateProfileDto, { firstName: '   ' })).toEqual([
      'Le prenom doit contenir au moins 1 caractere.',
    ]);
  });

  it('portent les memes messages a l inscription et au profil', () => {
    const messagesDe = (dto: new () => object, base: object) =>
      messagesDeRefus(dto, { ...base, firstName: 'a'.repeat(51) });

    expect(messagesDe(InscriptionDto, inscription)).toEqual([
      'Le prenom doit contenir au plus 50 caracteres.',
    ]);
    expect(messagesDe(UpdateProfileDto, {})).toEqual([
      'Le prenom doit contenir au plus 50 caracteres.',
    ]);
  });
});

class Saisie {
  @MotDePasseRobuste()
  motDePasse: string;
}

const messages = (corps: Record<string, unknown>): string[] =>
  messagesDeRefus(Saisie, corps);

describe('MotDePasseRobuste', () => {
  it('accepte un mot de passe de 12 caracteres avec majuscule, chiffre et special', () => {
    expect(messages({ motDePasse: 'StrongPassword123!' })).toEqual([]);
  });

  it('refuse un mot de passe de moins de 12 caracteres', () => {
    expect(messages({ motDePasse: 'Court1!' })).toContain(
      'Le mot de passe doit contenir au moins 12 caracteres.',
    );
  });

  it('refuse un mot de passe sans majuscule, chiffre ou caractere special', () => {
    expect(messages({ motDePasse: 'motdepasselong' })).toContain(
      'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractere special.',
    );
  });

  it('accepte 256 caracteres et refuse au-dela, comme la connexion', () => {
    expect(messages({ motDePasse: `A1!${'a'.repeat(253)}` })).toEqual([]);
    expect(messages({ motDePasse: `A1!${'a'.repeat(254)}` })).toEqual([
      'Le mot de passe est trop long.',
    ]);
  });
});

describe('borne d un mot de passe saisi', () => {
  it.each([
    ['l inscription', InscriptionDto, 'password'],
    ['la reinitialisation', ResetPasswordDto, 'newPassword'],
    ['la definition', SetPasswordDto, 'newPassword'],
    ['le changement', ChangePasswordDto, 'newPassword'],
    [
      'le mot de passe actuel du changement',
      ChangePasswordDto,
      'currentPassword',
    ],
    ['la connexion', LoginDto, 'password'],
  ])(
    'borne a 256 caracteres le mot de passe de %s',
    (_saisie, dto: new () => object, champ) => {
      const refusesPour = (motDePasse: string) =>
        champsRefuses(dto, { [champ]: motDePasse });

      expect(refusesPour(`A1!${'a'.repeat(253)}`)).not.toContain(champ);
      expect(refusesPour(`A1!${'a'.repeat(254)}`)).toContain(champ);
    },
  );
});
