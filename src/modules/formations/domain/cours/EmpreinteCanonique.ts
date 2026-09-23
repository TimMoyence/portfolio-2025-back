import { createHash } from 'node:crypto';
import { serialiserCanonique } from './VecteursFormule';

export function empreinteCanonique(valeur: unknown): string {
  const telQueStocke: unknown =
    valeur === undefined ? null : JSON.parse(JSON.stringify(valeur));
  return createHash('sha256')
    .update(serialiserCanonique(telQueStocke), 'utf8')
    .digest('hex');
}
