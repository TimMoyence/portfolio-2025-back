import { libelleOuCle } from './libelle-ou-cle';

describe('REF-03 · libelleOuCle', () => {
  const LIBELLES = { seo: 'SEO', trust: 'Crédibilité' } as const;

  it('rend le libellé d’une clé connue', () => {
    expect(libelleOuCle(LIBELLES, 'trust')).toBe('Crédibilité');
  });

  it('rend la clé elle-même quand elle est inconnue', () => {
    expect(libelleOuCle(LIBELLES, 'inconnue')).toBe('inconnue');
  });

  it('ignore les clés héritées du prototype', () => {
    expect(libelleOuCle(LIBELLES, 'toString')).toBe('toString');
    expect(libelleOuCle(LIBELLES, 'constructor')).toBe('constructor');
  });
});
