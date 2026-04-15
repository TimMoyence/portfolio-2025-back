import { pillarLabel } from './pillar-labels.util';

describe('pillarLabel', () => {
  it.each([
    ['seo', 'SEO'],
    ['performance', 'Performance'],
    ['technical', 'Tech & scalabilite'],
    ['trust', 'Credibilite'],
    ['conversion', 'Conversion'],
    ['aiVisibility', 'Visibilite IA'],
    ['citationWorthiness', 'Citabilite IA'],
  ])('mappe "%s" vers "%s"', (input, expected) => {
    expect(pillarLabel(input)).toBe(expected);
  });

  it('renvoie la chaine brute pour un pilier inconnu', () => {
    expect(pillarLabel('unknownPillar')).toBe('unknownPillar');
  });

  it('ne crashe pas sur chaine vide', () => {
    expect(pillarLabel('')).toBe('');
  });
});
