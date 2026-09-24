import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MotDePasseRobuste, RolesValides } from './regles-de-saisie';

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
