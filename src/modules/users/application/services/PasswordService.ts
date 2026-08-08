import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pbkdf2Sync, timingSafeEqual } from 'crypto';
import * as argon2 from 'argon2';

const TIMING_DECOY_INPUT = 'dummy-password-for-timing-safety';
const TIMING_DECOY_HASH_FALLBACK =
  '$argon2id$v=19$m=65536,t=3,p=4$UkVDT1ZFUllGQUxMQkFDSw$invalid';

@Injectable()
export class PasswordService implements OnModuleInit {
  private readonly secret: string;
  private readonly iterations = 120000;
  private readonly keyLength = 64;
  private readonly digest = 'sha512';
  private timingDecoyHash: Promise<string> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.secret =
      this.configService.get<string>('SECURE_KEY_FOR_PASSWORD_HASHING') ?? '';

    if (!this.secret) {
      throw new Error('SECURE_KEY_FOR_PASSWORD_HASHING is not defined');
    }
  }

  async onModuleInit(): Promise<void> {
    await this.precomputeTimingDecoyHash();
  }

  async equalizeVerifyTiming(password: string): Promise<void> {
    const decoy = await this.precomputeTimingDecoyHash();
    await argon2.verify(decoy, password).catch(() => false);
  }

  private precomputeTimingDecoyHash(): Promise<string> {
    this.timingDecoyHash ??= argon2
      .hash(TIMING_DECOY_INPUT, { type: argon2.argon2id })
      .catch(() => TIMING_DECOY_HASH_FALLBACK);
    return this.timingDecoyHash;
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
