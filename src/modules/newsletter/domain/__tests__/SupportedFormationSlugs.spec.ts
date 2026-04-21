import {
  isSupportedFormationSlug,
  SUPPORTED_FORMATION_SLUGS,
} from '../SupportedFormationSlugs';

describe('SupportedFormationSlugs', () => {
  it('expose une liste non vide de slugs', () => {
    expect(SUPPORTED_FORMATION_SLUGS.length).toBeGreaterThan(0);
  });

  it('contient les slugs publies en S1 + S2', () => {
    expect([...SUPPORTED_FORMATION_SLUGS].sort()).toEqual(
      ['automatiser-avec-ia', 'ia-solopreneurs'].sort(),
    );
  });

  it('isSupportedFormationSlug valide les slugs supportes', () => {
    for (const slug of SUPPORTED_FORMATION_SLUGS) {
      expect(isSupportedFormationSlug(slug)).toBe(true);
    }
  });

  it('isSupportedFormationSlug rejette les slugs inconnus et les non-string', () => {
    expect(isSupportedFormationSlug('slug-inconnu')).toBe(false);
    expect(isSupportedFormationSlug('')).toBe(false);
    expect(isSupportedFormationSlug(undefined)).toBe(false);
    expect(isSupportedFormationSlug(null)).toBe(false);
    expect(isSupportedFormationSlug(42)).toBe(false);
  });

  it('empeche la presence de doublons dans la liste (protection collision)', () => {
    const unique = new Set(SUPPORTED_FORMATION_SLUGS);
    expect(unique.size).toBe(SUPPORTED_FORMATION_SLUGS.length);
  });
});
