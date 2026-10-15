import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateUserDto } from './CreateUser.dto';
import { MotDePasseRobuste, RolesValides } from './regles-de-saisie';
import { UpdateProfileDto } from './UpdateProfile.dto';
import { UpdateUserDto } from './UpdateUser.dto';

const champsEnErreur = (
  dto: new () => object,
  corps: Record<string, unknown>,
): string[] =>
  validateSync(plainToInstance(dto, corps)).map((erreur) => erreur.property);

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
      const champsRefuses = (valeur: string) =>
        champsEnErreur(dto, { ...base, firstName: valeur, lastName: valeur });

      expect(['L', 'a'.repeat(50)].map(champsRefuses)).toEqual([[], []]);
      expect(['', 'a'.repeat(51)].map(champsRefuses)).toEqual([
        ['firstName', 'lastName'],
        ['firstName', 'lastName'],
      ]);
    },
  );

  it('portent les memes messages a l inscription et au profil', () => {
    const messagesDe = (dto: new () => object, base: object) =>
      validateSync(
        plainToInstance(dto, { ...base, firstName: 'a'.repeat(51) }),
      ).flatMap((erreur) => Object.values(erreur.constraints ?? {}));

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
  validateSync(plainToInstance(Saisie, corps)).flatMap((erreur) =>
    Object.values(erreur.constraints ?? {}),
  );

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
