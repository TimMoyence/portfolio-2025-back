import { installerSecretDeSignature } from '../../../../test/helpers/env-formations';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { cleEtudianteDe } from './CleEtudiante';

describe('cleEtudianteDe', () => {
  installerSecretDeSignature();

  it('derive la cle de l email normalise, signe dans le contexte eleve', () => {
    expect(cleEtudianteDe('  Lea@Example.test ')).toBe(
      '5dacb358b89c0fba70a287e01f4e06342d634d9ef5db2fa19b54f49646f85fbc',
    );
  });

  it('derive la meme cle d un email saisi avec espaces et majuscules', () => {
    expect(cleEtudianteDe('  Theo.Martin@Example.com ')).toBe(
      cleEtudianteDe('theo.martin@example.com'),
    );
  });

  it.each([
    ['theo.martin@example.com', 'lea.martin@example.com'],
    ['theo.martin@example.com', 'theomartin@example.com'],
  ])('derive deux cles distinctes de %p et %p', (premier, second) => {
    expect(cleEtudianteDe(premier)).not.toBe(cleEtudianteDe(second));
  });

  it.each(['"theo martin"@example.com', 'theo.martin', '   '])(
    'refuse de deriver une cle de %p, que l adresse email commune rejette',
    (email) => {
      expect(() => cleEtudianteDe(email)).toThrow(
        new DomainValidationError('Invalid student email'),
      );
    },
  );
});
