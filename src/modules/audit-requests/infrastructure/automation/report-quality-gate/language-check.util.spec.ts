import { hasLanguageMismatch } from './language-check.util';

describe('hasLanguageMismatch', () => {
  it('ne detecte aucun mismatch sur un texte en francais correct pour locale fr', () => {
    const text = 'Pour votre audit, optimisation et conversion prioritaires';
    expect(hasLanguageMismatch(text, 'fr')).toBe(false);
  });

  it('ne detecte aucun mismatch sur un texte en anglais correct pour locale en', () => {
    const text =
      'The audit prioritizes optimization and conversion for your impact';
    expect(hasLanguageMismatch(text, 'en')).toBe(false);
  });

  it('detecte un mismatch quand le texte est en anglais et locale fr', () => {
    const text =
      'The audit and the optimization with your priority for the conversion and implementation impact';
    expect(hasLanguageMismatch(text, 'fr')).toBe(true);
  });

  it('detecte un mismatch quand le texte est en francais et locale en', () => {
    const text =
      'Le audit la optimisation les des pour avec votre conversion impact priorite';
    expect(hasLanguageMismatch(text, 'en')).toBe(true);
  });

  it('detecte un melange fort FR/EN meme en locale fr', () => {
    const text =
      'Le audit the optimization pour with votre conversion your impact priorite';
    expect(hasLanguageMismatch(text, 'fr')).toBe(true);
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
