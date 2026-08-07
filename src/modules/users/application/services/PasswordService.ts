import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pbkdf2Sync, timingSafeEqual } from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly secret: string;
  private readonly iterations = 120000;
  private readonly keyLength = 64;
  private readonly digest = 'sha512';
  private readonly dummyHashPromise: Promise<string>;

  constructor(private readonly configService: ConfigService) {
    this.secret =
      this.configService.get<string>('SECURE_KEY_FOR_PASSWORD_HASHING') ?? '';

    if (!this.secret) {
      throw new Error('SECURE_KEY_FOR_PASSWORD_HASHING is not defined');
    }

    // Pre-calcul eager du hash factice des l'instanciation pour eviter
    // un "cold start" detectable au premier appel a performDummyVerify.
    this.dummyHashPromise = argon2
      .hash('dummy-password-for-timing-safety', { type: argon2.argon2id })
      .catch(
        () => '$argon2id$v=19$m=65536,t=3,p=4$UkVDT1ZFUllGQUxMQkFDSw$invalid',
      );
  }

  /**
   * Execute un verify Argon2id contre un hash factice pre-calcule pour egaliser
   * le temps de reponse quand un utilisateur n'existe pas, est inactif, ou n'a
   * pas de hash (compte Google-only). Protege contre l'enumeration d'utilisateurs
   * par analyse du timing de la route de login.
   */
  async performDummyVerify(password: string): Promise<void> {
    const dummy = await this.dummyHashPromise;
    await argon2.verify(dummy, password).catch(() => false);
  }

  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    if (storedHash.startsWith('$argon2')) {
      return argon2.verify(storedHash, password);
    }
    if (storedHash.includes(':')) {
      return this.verifyWithSalt(password, storedHash);
    }
    return this.verifyLegacy(password, storedHash);
  }

  needsRehash(storedHash: string): boolean {
    return !storedHash.startsWith('$argon2');
  }

  private verifyWithSalt(password: string, storedHash: string): boolean {
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const storedBuffer = Buffer.from(hashHex, 'hex');

    const derivedKey = pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest,
    );

    if (derivedKey.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedBuffer);
  }

  private verifyLegacy(password: string, storedHash: string): boolean {
    const hashed = pbkdf2Sync(
      password,
      this.secret,
      this.iterations,
      this.keyLength,
      this.digest,
    ).toString('hex');

    const hashedBuffer = Buffer.from(hashed, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (hashedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(hashedBuffer, storedBuffer);
  }
}
