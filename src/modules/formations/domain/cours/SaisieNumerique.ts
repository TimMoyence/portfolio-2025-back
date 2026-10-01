const ESPACES = new RegExp('[\\s\\u00a0\\u202f\\u2009]', 'g');
const MOINS_TYPOGRAPHIQUE = new RegExp('\\u2212', 'g');
const UNITES_LUES = [
  '%',
  'k?€',
  'euros?',
  'pts?',
  'points?',
  'factures?',
  'lignes?',
  'passages?',
  'kits?',
];
const SUFFIXES = new RegExp(`(?:${UNITES_LUES.join('|')})$`, 'i');
const DECIMAL = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

export function lireNombreSaisi(brut: string): number | null {
  const compacte = brut
    .replace(ESPACES, '')
    .replace(MOINS_TYPOGRAPHIQUE, '-')
    .replaceAll(',', '.')
    .replace(SUFFIXES, '');
  return DECIMAL.test(compacte) ? Number(compacte) : null;
}
