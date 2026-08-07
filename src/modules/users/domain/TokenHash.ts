import { createHash } from 'crypto';

export class TokenHash {
  private constructor(readonly value: string) {}

  static fromRaw(rawToken: string): TokenHash {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    return new TokenHash(hash);
  }
}
