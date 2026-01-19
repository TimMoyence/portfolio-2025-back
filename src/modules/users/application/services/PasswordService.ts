import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pbkdf2Sync, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordService {
  private readonly secret: string;
  private readonly iterations = 120000;
  private readonly keyLength = 64;
  private readonly digest = 'sha512';

  constructor(private readonly configService: ConfigService) {
    this.secret =
      this.configService.get<string>('SECURE_KEY_FOR_PASSWORD_HASHING') ?? '';

    if (!this.secret) {
      throw new Error('SECURE_KEY_FOR_PASSWORD_HASHING is not defined');
    }
  }

  hash(password: string): string {
    return pbkdf2Sync(
      password,
      this.secret,
      this.iterations,
      this.keyLength,
      this.digest,
    ).toString('hex');
  }

  verify(password: string, hash: string): boolean {
    const hashed = this.hash(password);
    const hashedBuffer = Buffer.from(hashed, 'hex');
    const storedBuffer = Buffer.from(hash, 'hex');

    if (hashedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(hashedBuffer, storedBuffer);
  }
}
