import { pbkdf2Sync } from 'crypto';
import {
  buildConfigService,
  TEST_HASHING_KEY as SECRET,
} from '../../../../../test/factories/env.factory';
import { installerVariables } from '../../../../../test/helpers/environnement';
import { PasswordService } from './PasswordService';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService(
      buildConfigService({ SECURE_KEY_FOR_PASSWORD_HASHING: SECRET }),
    );
  });

  describe('hash', () => {
    it('devrait hasher un mot de passe au format argon2id', async () => {
      const hash = await service.hash('MonMotDePasse123!');

      expect(hash).toMatch(/^\$argon2id\$/);
      expect(hash).not.toContain('::');
    });

    it('devrait produire des hashes differents pour le meme mot de passe (sel aleatoire)', async () => {
      const hash1 = await service.hash('IdenticalPassword1!');
      const hash2 = await service.hash('IdenticalPassword1!');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verify', () => {
    it('devrait verifier un hash argon2id correctement', async () => {
      const plainCredential = 'SecurePassword42!';
      const hash = await service.hash(plainCredential);

      expect(await service.verify(plainCredential, hash)).toBe(true);
      expect(await service.verify('WrongPassword!', hash)).toBe(false);
    });

    it('devrait verifier un hash PBKDF2 avec sel (format hex:hex — retrocompatibilite)', async () => {
      const salt = Buffer.from('a'.repeat(64), 'hex');
      const derivedKey = pbkdf2Sync(
        'SaltedPassword1!',
        salt,
        120000,
        64,
        'sha512',
      );
      const pbkdf2Hash = `${salt.toString('hex')}:${derivedKey.toString('hex')}`;

      expect(pbkdf2Hash).toContain(':');
      expect(await service.verify('SaltedPassword1!', pbkdf2Hash)).toBe(true);
      expect(await service.verify('WrongPassword!', pbkdf2Hash)).toBe(false);
    });

    it('devrait verifier un hash au format legacy sans sel (retrocompatibilite)', async () => {
      const legacyHash = pbkdf2Sync(
        'LegacyPassword1!',
        SECRET,
        120000,
        64,
        'sha512',
      ).toString('hex');

      expect(legacyHash).not.toContain(':');
      expect(await service.verify('LegacyPassword1!', legacyHash)).toBe(true);
      expect(await service.verify('WrongPassword!', legacyHash)).toBe(false);
    });
  });

  describe('needsRehash', () => {
    it('devrait retourner false pour un hash argon2id', async () => {
      const hash = await service.hash('TestPassword1!');

      expect(service.needsRehash(hash)).toBe(false);
    });

    it('devrait retourner true pour un hash PBKDF2 avec sel', () => {
      const pbkdf2Hash = 'abcdef1234567890:abcdef1234567890';

      expect(service.needsRehash(pbkdf2Hash)).toBe(true);
    });

    it('devrait retourner true pour un hash PBKDF2 legacy sans sel', () => {
      const legacyHash = pbkdf2Sync(
        'LegacyPassword1!',
        SECRET,
        120000,
        64,
        'sha512',
      ).toString('hex');

      expect(service.needsRehash(legacyHash)).toBe(true);
    });
  });

  describe('absente de sa configuration, meme posee dans l environnement du processus', () => {
    installerVariables(
      { SECURE_KEY_FOR_PASSWORD_HASHING: SECRET },
      'chaque-test',
    );

    it('devrait lever une erreur si SECURE_KEY_FOR_PASSWORD_HASHING n est pas defini', () => {
      expect(() => new PasswordService(buildConfigService())).toThrow(
        'SECURE_KEY_FOR_PASSWORD_HASHING is not defined',
      );
    });
  });

  it('devrait lever une erreur si SECURE_KEY_FOR_PASSWORD_HASHING fait moins de 32 caracteres hors blancs', () => {
    const courtConfigService = buildConfigService({
      SECURE_KEY_FOR_PASSWORD_HASHING: `  ${'k'.repeat(31)}  `,
    });

    expect(() => new PasswordService(courtConfigService)).toThrow(
      'SECURE_KEY_FOR_PASSWORD_HASHING must be at least 32 characters',
    );
  });
});
