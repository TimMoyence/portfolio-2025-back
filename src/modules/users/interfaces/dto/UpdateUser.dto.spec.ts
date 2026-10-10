import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateUserDto } from './UpdateUser.dto';

const champsRefuses = (corps: Record<string, unknown>): string[] =>
  validateSync(plainToInstance(UpdateUserDto, corps)).map(
    (erreur) => erreur.property,
  );

describe('UpdateUserDto', () => {
  it('accepte une mise à jour vide : chaque champ est facultatif', () => {
    expect(champsRefuses({})).toEqual([]);
  });

  it('accepte un prénom et un nom renseignés', () => {
    expect(champsRefuses({ firstName: 'Jean', lastName: 'Dupont' })).toEqual(
      [],
    );
  });

  it('refuse un prénom ou un nom vide, comme à la création', () => {
    expect(champsRefuses({ firstName: '', lastName: '' })).toEqual([
      'firstName',
      'lastName',
    ]);
  });

  it('applique au mot de passe et aux rôles les règles de la création', () => {
    expect(champsRefuses({ password: 'court', roles: ['weather'] })).toEqual([
      'password',
      'roles',
    ]);
  });
});
