import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const OCTETS_DU_SECRET = 32;

function empreinte(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

export const SecretDeReprise = {
  generer(): string {
    return randomBytes(OCTETS_DU_SECRET).toString('base64url');
  },

  empreinte,

  autorise(
    empreinteStockee: string | null,
    secretPresente: string | undefined,
  ): boolean {
    if (empreinteStockee === null) {
      return true;
    }
    if (secretPresente === undefined || secretPresente.length === 0) {
      return false;
    }
    return timingSafeEqual(
      Buffer.from(empreinte(secretPresente), 'hex'),
      Buffer.from(empreinteStockee, 'hex'),
    );
  },
};
