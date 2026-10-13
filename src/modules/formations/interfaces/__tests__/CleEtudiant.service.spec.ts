import { installerSecretDeSignature } from '../../../../../test/helpers/env-formations';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { CleEtudiantService } from '../CleEtudiant.service';

describe('CleEtudiantService', () => {
  installerSecretDeSignature();
  const cles = new CleEtudiantService();

  it('derive la cle de l email normalise, signe dans le contexte eleve', () => {
    expect(cles.de('  Lea@Example.test ')).toBe(
      '5dacb358b89c0fba70a287e01f4e06342d634d9ef5db2fa19b54f49646f85fbc',
    );
  });

  it('derive la meme cle d un email saisi avec espaces et majuscules', () => {
    expect(cles.de('  Theo.Martin@Example.com ')).toBe(
      cles.de('theo.martin@example.com'),
    );
  });

  it.each([
    ['theo.martin@example.com', 'lea.martin@example.com'],
    ['theo.martin@example.com', 'theomartin@example.com'],
  ])('derive deux cles distinctes de %p et %p', (premier, second) => {
    expect(cles.de(premier)).not.toBe(cles.de(second));
  });

  it.each(['"theo martin"@example.com', 'theo.martin', '   '])(
    'refuse de deriver une cle de %p, que l adresse email commune rejette',
    (email) => {
      expect(() => cles.de(email)).toThrow(
        new DomainValidationError('Invalid student email'),
      );
    },
  );
});
