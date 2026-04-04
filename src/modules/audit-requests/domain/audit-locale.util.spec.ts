import { resolveAuditLocale, localeFromUrlPath } from './audit-locale.util';

describe('audit-locale.util', () => {
  describe('resolveAuditLocale', () => {
    it('devrait retourner fr pour une valeur non-string', () => {
      expect(resolveAuditLocale(undefined)).toBe('fr');
      expect(resolveAuditLocale(null)).toBe('fr');
      expect(resolveAuditLocale(42)).toBe('fr');
    });

    it('devrait retourner le fallback personnalise pour une valeur non-string', () => {
      expect(resolveAuditLocale(undefined, 'en')).toBe('en');
    });

    it('devrait retourner en pour "en"', () => {
      expect(resolveAuditLocale('en')).toBe('en');
    });

    it('devrait retourner en pour "en-US"', () => {
      expect(resolveAuditLocale('en-US')).toBe('en');
    });

    it('devrait retourner fr pour "fr"', () => {
      expect(resolveAuditLocale('fr')).toBe('fr');
    });

    it('devrait retourner fr pour "fr-FR"', () => {
      expect(resolveAuditLocale('fr-FR')).toBe('fr');
    });

    it('devrait retourner le fallback pour une locale inconnue', () => {
      expect(resolveAuditLocale('de')).toBe('fr');
      expect(resolveAuditLocale('de', 'en')).toBe('en');
    });

    it('devrait gerer les espaces et la casse', () => {
      expect(resolveAuditLocale('  EN  ')).toBe('en');
      expect(resolveAuditLocale('  FR  ')).toBe('fr');
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
