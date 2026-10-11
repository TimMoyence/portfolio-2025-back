import {
  secretHmac,
  signerAvecLeSecret,
} from '../../../common/domain/crypto/secret-hmac';

const SECRET_DE_SIGNATURE = 'FORMATION_REVIEW_TOKEN_SECRET';

export function secretDeSignature(): string {
  return secretHmac(SECRET_DE_SIGNATURE);
}

export function signer(message: string): string {
  return signerAvecLeSecret(SECRET_DE_SIGNATURE, message);
}
