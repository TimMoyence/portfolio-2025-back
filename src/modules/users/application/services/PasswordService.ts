import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Service de hachage et verification des mots de passe via PBKDF2-SHA512.
 *
 * Genere un sel aleatoire unique par utilisateur (32 octets).
 * Le hash est stocke au format `sel_hex:hash_hex`.
 *
 * Supporte egalement le format legacy (hash sans sel, utilisant un secret statique)
 * pour la retrocompatibilite avec les comptes existants.
 */
@Injectable()
export class PasswordService {
  private readonly secret: string;
  private readonly iterations = 120000;
  private readonly keyLength = 64;
  private readonly digest = 'sha512';
  private readonly saltLength = 32;

  constructor(private readonly configService: ConfigService) {
    this.secret =
      this.configService.get<string>('SECURE_KEY_FOR_PASSWORD_HASHING') ?? '';

    if (!this.secret) {
      throw new Error('SECURE_KEY_FOR_PASSWORD_HASHING is not defined');
    }
  }

  /**
   * Hache un mot de passe avec un sel aleatoire unique.
   * @returns Hash au format `sel_hex:hash_hex`
   */
  hash(password: string): string {
    const salt = randomBytes(this.saltLength);
    const derivedKey = pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest,
    );
    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
  }

  /**
   * Verifie un mot de passe contre un hash stocke.
   * Detecte automatiquement le format (nouveau avec sel ou legacy sans sel).
   */
  verify(password: string, storedHash: string): boolean {
    if (storedHash.includes(':')) {
      return this.verifyWithSalt(password, storedHash);
    }
    return this.verifyLegacy(password, storedHash);
  }

  /** Verification avec le nouveau format `sel_hex:hash_hex`. */
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

  /** Verification avec l'ancien format (hash PBKDF2 utilisant le secret statique comme sel). */
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
