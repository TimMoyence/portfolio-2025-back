import { empreinteSha256 } from '../../../../common/domain/crypto/empreintes';
import { serialiserCanonique } from './VecteursFormule';

export function empreinteCanonique(valeur: unknown): string {
  const telQueStocke: unknown =
    valeur === undefined ? null : JSON.parse(JSON.stringify(valeur));
  return empreinteSha256(serialiserCanonique(telQueStocke));
}
