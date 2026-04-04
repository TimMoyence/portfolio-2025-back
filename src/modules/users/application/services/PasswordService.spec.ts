import { ConfigService } from '@nestjs/config';
import { pbkdf2Sync } from 'crypto';
import { PasswordService } from './PasswordService';

describe('PasswordService', () => {
  const SECRET = 'test-secret-for-password-hashing';
  let configService: jest.Mocked<ConfigService>;
  let service: PasswordService;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'SECURE_KEY_FOR_PASSWORD_HASHING') return SECRET;
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new PasswordService(configService);
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
      const password = 'SecurePassword42!';
      const hash = await service.hash(password);

      expect(await service.verify(password, hash)).toBe(true);
      expect(await service.verify('WrongPassword!', hash)).toBe(false);
    });

    it('devrait verifier un hash PBKDF2 avec sel (format hex:hex — retrocompatibilite)', async () => {
      // Simuler l'ancien format avec sel unique : sel_hex:hash_hex
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
      // Simuler l'ancien format : hash sans sel (utilise le secret statique)
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

  it('devrait lever une erreur si SECURE_KEY_FOR_PASSWORD_HASHING n est pas defini', () => {
    const emptyConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as jest.Mocked<ConfigService>;

    expect(() => new PasswordService(emptyConfigService)).toThrow(
      'SECURE_KEY_FOR_PASSWORD_HASHING is not defined',
    );
  });
});
