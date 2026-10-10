import { createHash, randomBytes } from 'crypto';

const OCTETS_D_UN_JETON = 32;

export const FORME_D_UN_JETON_EMIS = new RegExp(
  `^[0-9a-f]{${OCTETS_D_UN_JETON * 2}}$`,
);

export class TokenHash {
  private constructor(readonly value: string) {}

  static fromRaw(rawToken: string): TokenHash {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    return new TokenHash(hash);
  }
}

export interface JetonEmis {
  readonly brut: string;
  readonly empreinte: string;
}

export function emettreJeton(): JetonEmis {
  const brut = randomBytes(OCTETS_D_UN_JETON).toString('hex');
  return { brut, empreinte: TokenHash.fromRaw(brut).value };
}
