import { randomBytes } from 'node:crypto';
import {
  egalEnTempsConstant,
  empreinteSha256,
} from '../../../common/domain/crypto/empreintes';

const OCTETS_DU_SECRET = 32;

export const SecretDeReprise = {
  generer(): string {
    return randomBytes(OCTETS_DU_SECRET).toString('base64url');
  },

  empreinte: empreinteSha256,

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
    return egalEnTempsConstant(
      empreinteSha256(secretPresente),
      empreinteStockee,
    );
  },
};
