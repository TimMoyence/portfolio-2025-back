import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { ROLES_KEY } from '../../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../../common/interfaces/auth/roles.guard';
import { ControleurFormateur } from '../formations-acces';

@ControleurFormateur()
class ControleurTemoin {}

describe('ControleurFormateur', () => {
  it('monte le controleur sous le chemin des formations', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ControleurTemoin)).toBe(
      'formations',
    );
  });

  it('reserve toutes les routes au role formateur, garde des roles comprise', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ControleurTemoin)).toEqual([
      'teacher',
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, ControleurTemoin)).toEqual([
      RolesGuard,
    ]);
  });

  it('documente la route sous le tag formations avec un jeton porteur', () => {
    expect(Reflect.getMetadata(DECORATORS.API_TAGS, ControleurTemoin)).toEqual([
      'formations',
    ]);
    expect(
      Reflect.getMetadata(DECORATORS.API_SECURITY, ControleurTemoin),
    ).toEqual([{ bearer: [] }]);
  });
});
