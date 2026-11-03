import { origineSure, urlCandidateMemeOrigine } from './url.util';

describe('url.util', () => {
  describe('origineSure', () => {
    it('rend l origine d une URL absolue, sans chemin, requête ni fragment', () => {
      expect(origineSure('https://example.com:8443/fr/page?a=1#haut')).toBe(
        'https://example.com:8443',
      );
    });

    it('rend null pour une adresse illisible', () => {
      expect(origineSure('pas une url')).toBeNull();
      expect(origineSure('')).toBeNull();
    });
  });

  describe('urlCandidateMemeOrigine', () => {
    const base = 'https://example.com/fr/accueil';

    it('résout un lien relatif sur la base et retire le fragment', () => {
      expect(urlCandidateMemeOrigine('contact#formulaire', base)).toBe(
        'https://example.com/fr/contact',
      );
      expect(urlCandidateMemeOrigine('/a-propos?x=1', base)).toBe(
        'https://example.com/a-propos?x=1',
      );
    });

    it('écarte une autre origine, un protocole non web et une adresse illisible', () => {
      expect(
        [
          'https://autre.example.com/page',
          'https://example.com:8443/page',
          'mailto:contact@example.com',
          'tel:+33100000000',
          'ftp://example.com/fichier',
          'https://[',
        ].map((brut) => urlCandidateMemeOrigine(brut, base)),
      ).toEqual([null, null, null, null, null, null]);
    });

    it('rend null quand la base elle-même est illisible', () => {
      expect(urlCandidateMemeOrigine('/page', 'pas une url')).toBeNull();
    });
  });
});
