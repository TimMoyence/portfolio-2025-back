import { TEST_FORMATION_REVIEW_TOKEN_SECRET as SECRET } from '../../../../test/factories/env.factory';
import {
  appliquer,
  installerVariables,
} from '../../../../test/helpers/environnement';
import {
  estUnSecretValable,
  secretHmac,
  signerAvecLeSecret,
} from './secret-hmac';

const NOM = 'FORMATION_REVIEW_TOKEN_SECRET';

describe('estUnSecretValable', () => {
  it.each<[string, string | undefined, boolean]>([
    ['absent', undefined, false],
    ['de 31 caracteres', 's'.repeat(31), false],
    ['de 31 caracteres entoure de blancs', `  ${'s'.repeat(31)}  `, false],
    ['de 32 caracteres', 's'.repeat(32), true],
    ['de 32 caracteres entoure de blancs', `  ${'s'.repeat(32)}  `, true],
  ])('juge un secret %s hors blancs', (_cas, secret, valable) => {
    expect(estUnSecretValable(secret)).toBe(valable);
  });
});

describe('secretHmac', () => {
  installerVariables({ [NOM]: SECRET }, 'chaque-test');

  it('rend le secret de la variable quand il atteint la longueur minimale', () => {
    expect(secretHmac(NOM)).toBe(SECRET);
  });

  it.each([
    ['absent', undefined],
    ['trop court', 'court'],
    ['fait de blancs', ' '.repeat(40)],
    ['de 31 caracteres entoure de blancs', ` ${'s'.repeat(31)} `],
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
      '5dacb358b89c0fba70a287e01f4e06342d634d9ef5db2fa19b54f49646f85fbc',
    );
  });

  it('refuse de signer sans secret valide', () => {
    appliquer({ [NOM]: 'court' });

    expect(() => signerAvecLeSecret(NOM, 'message')).toThrow(NOM);
  });
});
