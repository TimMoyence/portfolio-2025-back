import { cleDePage } from './cle-de-page.util';

describe('cleDePage', () => {
  it.each([
    ['https://acme.fr', 'https://acme.fr/'],
    ['https://acme.fr/offre/', 'https://acme.fr/offre'],
    ['https://acme.fr/offre#tarifs', 'https://acme.fr/offre'],
    ['https://ACME.fr/offre', 'https://acme.fr/offre'],
  ])('donne la meme cle a %s et %s', (une, autre) => {
    expect(cleDePage(une)).toBe(cleDePage(autre));
  });

  it.each([
    ['https://acme.fr/offre', 'https://acme.fr/offre?plan=pro'],
    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- le test verifie justement que le scheme http donne une autre page
    ['https://acme.fr/offre', 'http://acme.fr/offre'],
    ['https://acme.fr/offre', 'https://acme.fr/Offre'],
  ])('distingue %s de %s', (une, autre) => {
    expect(cleDePage(une)).not.toBe(cleDePage(autre));
  });

  it('resout une adresse relative depuis sa base', () => {
    expect(cleDePage('/offre/', 'https://acme.fr/accueil')).toBe(
      cleDePage('https://acme.fr/offre'),
    );
  });

  it('rend null pour une adresse illisible', () => {
    expect(cleDePage('pas une url')).toBeNull();
  });
});
