import { IS_PUBLIC_KEY } from '../../../../common/interfaces/auth/public.decorator';
import { routesDuControleur } from '../../../../../test/helpers/metadonnees-de-route';
import { AuthController } from '../Auth.controller';

describe('AuthController, routes du compte connecte', () => {
  it('passe par JwtAuthGuard, qui refuse un compte desactive, sur chaque route qui lit le compte du jeton', () => {
    const protegees = routesDuControleur(AuthController)
      .filter(
        ({ gestionnaire }) =>
          Reflect.getMetadata(IS_PUBLIC_KEY, gestionnaire) !== true,
      )
      .map(({ chemin }) => chemin);

    expect(protegees).toEqual([
      'change-password',
      'set-password',
      'profile',
      'me',
    ]);
  });
});
