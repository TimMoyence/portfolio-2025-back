import { hasLanguageMismatch } from './language-check.util';

describe('hasLanguageMismatch', () => {
  it.each([
    [
      'texte francais correct pour locale fr',
      'Pour votre audit, optimisation et conversion prioritaires',
      'fr',
      false,
    ],
    [
      'texte anglais correct pour locale en',
      'The audit prioritizes optimization and conversion for your impact',
      'en',
      false,
    ],
    [
      'texte anglais pour locale fr',
      'The audit and the optimization with your priority for the conversion and implementation impact',
      'fr',
      true,
    ],
    [
      'texte francais pour locale en',
      'Le audit la optimisation les des pour avec votre conversion impact priorite',
      'en',
      true,
    ],
    [
      'melange fort FR/EN pour locale fr',
      'Le audit the optimization pour with votre conversion your impact priorite',
      'fr',
      true,
    ],
  ] as const)('%s -> %s', (_label, text, locale, expected) => {
    expect(hasLanguageMismatch(text, locale)).toBe(expected);
  });

  it('tolere une phrase courte mono-marker (pas assez fort pour trigger)', () => {
    expect(hasLanguageMismatch('le chat', 'fr')).toBe(false);
    expect(hasLanguageMismatch('the cat', 'en')).toBe(false);
  });

  it('est case-insensitive sur les markers', () => {
    const text = 'LE LA LES DES POUR AVEC';
    expect(hasLanguageMismatch(text, 'fr')).toBe(false);
  });

  it('ignore la ponctuation entre markers', () => {
    const text = 'Le, la, les, des, pour, avec, votre, audit.';
    expect(hasLanguageMismatch(text, 'fr')).toBe(false);
  });
});
