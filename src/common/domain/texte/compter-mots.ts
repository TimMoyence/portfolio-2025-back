import { compacterBlancs } from './compacter-blancs';

export function compterMots(texte: string): number {
  const compact = compacterBlancs(texte);
  return compact === '' ? 0 : compact.split(' ').length;
}
