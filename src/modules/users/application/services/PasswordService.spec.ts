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
    it('devrait hasher un mot de passe avec un sel unique (format sel:hash)', () => {
      const hash = service.hash('MonMotDePasse123!');

      expect(hash).toContain(':');
      const [salt, derivedKey] = hash.split(':');
      expect(salt).toHaveLength(64); // 32 bytes en hex
      expect(derivedKey).toHaveLength(128); // 64 bytes en hex
    });

    it('devrait produire des hashes differents pour le meme mot de passe (sel aleatoire)', () => {
      const hash1 = service.hash('IdenticalPassword1!');
      const hash2 = service.hash('IdenticalPassword1!');

      expect(hash1).not.toBe(hash2);

      const [salt1] = hash1.split(':');
      const [salt2] = hash2.split(':');
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('verify', () => {
    it('devrait verifier un hash avec sel unique', () => {
      const password = 'SecurePassword42!';
      const hash = service.hash(password);

      expect(service.verify(password, hash)).toBe(true);
    });

    it('devrait rejeter un mot de passe incorrect avec le nouveau format', () => {
      const hash = service.hash('CorrectPassword1!');

      expect(service.verify('WrongPassword1!', hash)).toBe(false);
    });

    it('devrait verifier un hash au format legacy (retrocompatibilite)', () => {
      // Simuler l'ancien format : hash sans sel (utilise le secret statique)
      const legacyHash = pbkdf2Sync(
        'LegacyPassword1!',
        SECRET,
        120000,
        64,
        'sha512',
      ).toString('hex');

      // Le hash legacy ne contient pas de ':'
      expect(legacyHash).not.toContain(':');

      // La verification doit fonctionner avec l'ancien format
      expect(service.verify('LegacyPassword1!', legacyHash)).toBe(true);
      expect(service.verify('WrongPassword!', legacyHash)).toBe(false);
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
