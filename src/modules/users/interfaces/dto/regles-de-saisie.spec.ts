import {
  champsRefuses,
  messagesDeRefus,
} from '../../../../../test/helpers/validation-pipe';
import { ChangePasswordDto } from './ChangePassword.dto';
import { CreateUserDto } from './CreateUser.dto';
import { LoginDto } from './Login.dto';
import { MotDePasseRobuste, RolesValides } from './regles-de-saisie';
import { ResetPasswordDto } from './ResetPassword.dto';
import { SetPasswordDto } from './SetPassword.dto';
import { UpdateProfileDto } from './UpdateProfile.dto';
import { UpdateUserDto } from './UpdateUser.dto';

describe('prenom et nom d un compte', () => {
  const secretRobuste = 'StrongPassword123!';
  const inscription = {
    email: 'lea@example.com',
    password: secretRobuste,
    firstName: 'Lea',
    lastName: 'Martin',
  };

  it.each([
    ['l inscription', CreateUserDto, inscription],
    ['la modification par l admin', UpdateUserDto, {}],
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

  it('portent les memes messages a l inscription et au profil', () => {
    const messagesDe = (dto: new () => object, base: object) =>
      messagesDeRefus(dto, { ...base, firstName: 'a'.repeat(51) });

    expect(messagesDe(CreateUserDto, inscription)).toEqual([
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

  @RolesValides()
  roles?: string[];
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
    ['l inscription', CreateUserDto, 'password'],
    ['la modification par l admin', UpdateUserDto, 'password'],
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

describe('RolesValides', () => {
  it('accepte l absence de roles et des roles connus', () => {
    expect(messages({ motDePasse: 'StrongPassword123!' })).toEqual([]);
    expect(
      messages({ motDePasse: 'StrongPassword123!', roles: ['teacher'] }),
    ).toEqual([]);
  });

  it('refuse un role inconnu', () => {
    expect(
      messages({ motDePasse: 'StrongPassword123!', roles: ['weather'] }),
    ).toContain('Chaque role doit etre un role valide');
  });
});
