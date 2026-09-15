import { buildCoursDeTest } from '../../../../../../test/factories/cours.factory';
import { B2_01_TRAITEMENT_INFORMATION_CHIFFREE } from './b2-01-traitement-information-chiffree';
import { creerCatalogue } from './Catalogue';
import { CATALOGUE_COURS_STATIQUE } from './index';

describe('creerCatalogue', () => {
  it('trouve un cours par son slug', () => {
    const cours = buildCoursDeTest({ slug: 'proportions' });
    const catalogue = creerCatalogue([cours]);
    expect(catalogue.trouver('proportions')).toBe(cours);
  });

  it('rend null pour un slug absent du catalogue', () => {
    const catalogue = creerCatalogue([
      buildCoursDeTest({ slug: 'proportions' }),
    ]);
    expect(catalogue.trouver('inconnu')).toBeNull();
  });

  it('refuse un catalogue avec deux cours de meme slug', () => {
    const premier = buildCoursDeTest({ slug: 'meme-cours' });
    const second = buildCoursDeTest({ slug: 'meme-cours' });
    expect(() => creerCatalogue([premier, second])).toThrow(
      'Slug de cours en double dans le catalogue : « meme-cours ».',
    );
  });
});

describe('CATALOGUE_COURS_STATIQUE', () => {
  it('trouve le cours b2-01-traitement-information-chiffree publie', () => {
    expect(
      CATALOGUE_COURS_STATIQUE.trouver('b2-01-traitement-information-chiffree'),
    ).toBe(B2_01_TRAITEMENT_INFORMATION_CHIFFREE);
  });

  it('rend null pour un slug absent du catalogue publie', () => {
    expect(CATALOGUE_COURS_STATIQUE.trouver('inconnu')).toBeNull();
  });
});
