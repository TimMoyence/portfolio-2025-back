import { localeDeRedaction, localeFromUrlPath } from './audit-locale.util';

describe('audit-locale.util', () => {
  describe('localeDeRedaction', () => {
    it('retient la langue demandee pour l audit', () => {
      expect(localeDeRedaction('en-US', 'fr')).toBe('en');
    });

    it('retombe sur la langue configuree quand la demande est inexploitable', () => {
      expect(localeDeRedaction(undefined, 'en')).toBe('en');
      expect(localeDeRedaction('de', 'EN-gb')).toBe('en');
    });

    it('redige en francais quand ni la demande ni la configuration ne sont exploitables', () => {
      expect(localeDeRedaction('de', 'es')).toBe('fr');
    });
  });

  describe('localeFromUrlPath', () => {
    it('devrait retourner null pour une valeur non-string', () => {
      expect(localeFromUrlPath(undefined)).toBeNull();
      expect(localeFromUrlPath(null)).toBeNull();
      expect(localeFromUrlPath(42)).toBeNull();
    });

    it('devrait detecter fr dans un chemin', () => {
      expect(localeFromUrlPath('/fr/')).toBe('fr');
      expect(localeFromUrlPath('/fr/page')).toBe('fr');
    });

    it('devrait detecter en dans un chemin', () => {
      expect(localeFromUrlPath('/en/')).toBe('en');
      expect(localeFromUrlPath('/en/about')).toBe('en');
    });

    it('devrait retourner null si aucune locale dans le chemin', () => {
      expect(localeFromUrlPath('/page/about')).toBeNull();
      expect(localeFromUrlPath('/de/page')).toBeNull();
    });

    it('devrait detecter la locale en debut de chemin', () => {
      expect(localeFromUrlPath('fr/page')).toBe('fr');
    });
  });
});
