import {
  appliquer,
  installerVariables,
} from '../../../../../test/helpers/environnement';
import { secretDeSignature, signer } from '../SignatureFormations';

const SECRET = 'secret-de-test-formations-assez-long-1234';

describe('SignatureFormations', () => {
  installerVariables({ FORMATION_REVIEW_TOKEN_SECRET: SECRET }, 'chaque-test');

  it('signe le message en HMAC-SHA256 hexadecimal avec le secret configure', () => {
    expect(signer('eleve:lea@example.test')).toBe(
      '5602b8e555d803e11aa2f32a126ecd9d59dfbfab8432f9fcb10d04b8e6344026',
    );
  });

  it('rend le secret configure quand il atteint la longueur minimale', () => {
    expect(secretDeSignature()).toBe(SECRET);
  });

  it.each([
    ['absent', undefined],
    ['trop court', 'court'],
  ])('refuse de signer avec un secret %s', (_cas, valeur) => {
    appliquer({ FORMATION_REVIEW_TOKEN_SECRET: valeur });

    expect(() => signer('message')).toThrow(
      'FORMATION_REVIEW_TOKEN_SECRET doit etre configure avec au moins 32 caracteres',
    );
  });
});
