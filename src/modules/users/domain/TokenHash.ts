import { createHash } from 'crypto';

/** Value object domaine pour le hachage SHA-256 d'un token brut. */
export class TokenHash {
  private constructor(readonly value: string) {}

  /** Hache un token brut en SHA-256 hexadecimal. */
  static fromRaw(rawToken: string): TokenHash {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    return new TokenHash(hash);
  }
}
