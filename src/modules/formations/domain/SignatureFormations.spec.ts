import { installerSecretDeSignature } from '../../../../test/helpers/env-formations';
import { appliquer } from '../../../../test/helpers/environnement';
import { signer } from './SignatureFormations';

describe('SignatureFormations', () => {
  installerSecretDeSignature('chaque-test');

  it('signe le message en HMAC-SHA256 hexadecimal avec le secret configure', () => {
    expect(signer('eleve:lea@example.test')).toBe(
      '5dacb358b89c0fba70a287e01f4e06342d634d9ef5db2fa19b54f49646f85fbc',
    );
  });

  it('refuse de signer sans FORMATION_REVIEW_TOKEN_SECRET', () => {
    appliquer({ FORMATION_REVIEW_TOKEN_SECRET: undefined });

    expect(() => signer('message')).toThrow('FORMATION_REVIEW_TOKEN_SECRET');
  });
});
