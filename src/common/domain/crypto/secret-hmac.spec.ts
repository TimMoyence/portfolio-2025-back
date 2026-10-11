import {
  appliquer,
  installerVariables,
} from '../../../../test/helpers/environnement';
import { secretHmac, signerAvecLeSecret } from './secret-hmac';

const NOM = 'SECRET_HMAC_DE_TEST';
const SECRET = 'secret-de-test-formations-assez-long-1234';

describe('secretHmac', () => {
  installerVariables({ [NOM]: SECRET }, 'chaque-test');

  it('rend le secret de la variable quand il atteint la longueur minimale', () => {
    expect(secretHmac(NOM)).toBe(SECRET);
  });

  it.each([
    ['absent', undefined],
    ['trop court', 'court'],
  ])('refuse un secret %s en nommant sa variable', (_cas, valeur) => {
    appliquer({ [NOM]: valeur });

    expect(() => secretHmac(NOM)).toThrow(
      `${NOM} doit etre configure avec au moins 32 caracteres`,
    );
  });
});

describe('signerAvecLeSecret', () => {
  installerVariables({ [NOM]: SECRET }, 'chaque-test');

  it('signe le message en HMAC-SHA256 hexadecimal avec le secret de la variable', () => {
    expect(signerAvecLeSecret(NOM, 'eleve:lea@example.test')).toBe(
      '5602b8e555d803e11aa2f32a126ecd9d59dfbfab8432f9fcb10d04b8e6344026',
    );
  });

  it('refuse de signer sans secret valide', () => {
    appliquer({ [NOM]: 'court' });

    expect(() => signerAvecLeSecret(NOM, 'message')).toThrow(NOM);
  });
});
