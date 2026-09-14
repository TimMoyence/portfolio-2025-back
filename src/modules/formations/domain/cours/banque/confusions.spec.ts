import { CONCEPTS } from './concepts';
import { CONFUSIONS, libelleDeConfusion } from './confusions';

describe('CONFUSIONS', () => {
  it('rattache chaque confusion a un concept de la banque', () => {
    for (const confusion of Object.values(CONFUSIONS)) {
      expect(CONCEPTS).toContain(confusion.concept);
      expect(confusion.libelle.trim()).not.toBe('');
    }
  });
});

describe('libelleDeConfusion', () => {
  it('rend le libelle d une confusion connue', () => {
    expect(libelleDeConfusion('hausse-baisse-symetriques')).toBe(
      CONFUSIONS['hausse-baisse-symetriques'].libelle,
    );
  });

  it('rend null pour un identifiant inconnu ou herite', () => {
    expect(libelleDeConfusion('inconnue')).toBeNull();
    expect(libelleDeConfusion('toString')).toBeNull();
  });
});
