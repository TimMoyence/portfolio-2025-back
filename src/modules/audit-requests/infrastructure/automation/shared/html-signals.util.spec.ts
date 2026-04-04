import {
  detectCmsHints,
  pickHeaders,
  extractSetCookiePatterns,
  CACHE_HEADER_KEYS,
  SECURITY_HEADER_KEYS,
} from './html-signals.util';

describe('html-signals.util', () => {
  describe('detectCmsHints', () => {
    it('devrait detecter WordPress', () => {
      expect(
        detectCmsHints('<link href="/wp-content/themes/my-theme">'),
      ).toEqual(['WordPress']);
    });

    it('devrait detecter Next.js', () => {
      expect(
        detectCmsHints('<script src="/_next/static/chunks/app.js">'),
      ).toEqual(['Next.js']);
    });

    it('devrait detecter Shopify', () => {
      expect(detectCmsHints('<meta name="shopify-checkout">')).toEqual([
        'Shopify',
      ]);
    });

    it('devrait detecter Wix', () => {
      expect(detectCmsHints('<div class="wix-site-body">')).toEqual(['Wix']);
    });

    it('devrait detecter Webflow', () => {
      expect(detectCmsHints('<html data-wf-domain="webflow">')).toEqual([
        'Webflow',
      ]);
    });

    it('devrait detecter Drupal', () => {
      expect(
        detectCmsHints('<meta name="Generator" content="drupal">'),
      ).toEqual(['Drupal']);
    });

    it('devrait detecter Joomla', () => {
      expect(
        detectCmsHints('<meta name="generator" content="joomla">'),
      ).toEqual(['Joomla']);
    });

    it('devrait retourner un tableau vide si aucun CMS detecte', () => {
      expect(detectCmsHints('<html><body>Hello</body></html>')).toEqual([]);
    });

    it('devrait detecter plusieurs CMS', () => {
      const html = '<div>wp-content</div><script src="/_next/static"></script>';
      const hints = detectCmsHints(html);
      expect(hints).toContain('WordPress');
      expect(hints).toContain('Next.js');
    });
  });

  describe('pickHeaders', () => {
    it('devrait retourner les headers correspondants', () => {
      const headers = {
        'cache-control': 'max-age=3600',
        'content-type': 'text/html',
        'x-cache': 'HIT',
      };
      const result = pickHeaders(headers, CACHE_HEADER_KEYS);
      expect(result).toEqual({
        'cache-control': 'max-age=3600',
        'x-cache': 'HIT',
      });
    });

    it('devrait retourner un objet vide si aucun header ne correspond', () => {
      const headers = { 'content-type': 'text/html' };
      const result = pickHeaders(headers, SECURITY_HEADER_KEYS);
      expect(result).toEqual({});
    });

    it('devrait ignorer les headers avec valeur vide', () => {
      const headers = { 'cache-control': '' };
      const result = pickHeaders(headers, CACHE_HEADER_KEYS);
      expect(result).toEqual({});
    });
  });

  describe('extractSetCookiePatterns', () => {
    it('devrait retourner un tableau vide pour undefined', () => {
      expect(extractSetCookiePatterns(undefined)).toEqual([]);
    });

    it('devrait retourner un tableau vide pour une chaine vide', () => {
      expect(extractSetCookiePatterns('')).toEqual([]);
    });

    it('devrait extraire les noms de cookies', () => {
      const raw = '_ga=GA1.2.123456; Path=/';
      const result = extractSetCookiePatterns(raw);
      expect(result).toContain('_ga');
    });

    it('devrait extraire le premier cookie d un header multi-cookies', () => {
      const raw = 'sid=abc123; Path=/; HttpOnly';
      const result = extractSetCookiePatterns(raw);
      expect(result).toContain('sid');
    });

    it('devrait retourner un resultat pour chaque pattern match', () => {
      const raw = 'a=1,b=2,c=3';
      const result = extractSetCookiePatterns(raw);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toBe('a');
    });

    it('devrait limiter a 12 resultats maximum', () => {
      // 15 cookies separes par virgule sans espace
      const cookies = Array.from({ length: 15 }, (_, i) => `c${i}=v${i}`).join(
        ',',
      );
      const result = extractSetCookiePatterns(cookies);
      expect(result.length).toBeLessThanOrEqual(12);
    });
  });

  describe('constantes exportees', () => {
    it('devrait exporter les cles de cache headers', () => {
      expect(CACHE_HEADER_KEYS).toContain('cache-control');
      expect(CACHE_HEADER_KEYS).toContain('etag');
    });

    it('devrait exporter les cles de securite headers', () => {
      expect(SECURITY_HEADER_KEYS).toContain('strict-transport-security');
      expect(SECURITY_HEADER_KEYS).toContain('content-security-policy');
    });
  });
});
