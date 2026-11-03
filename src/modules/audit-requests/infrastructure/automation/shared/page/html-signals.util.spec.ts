import { load } from 'cheerio';
import {
  detectCmsHints,
  pickHeaders,
  extractSetCookiePatterns,
  CACHE_HEADER_KEYS,
  SECURITY_HEADER_KEYS,
  lireSignauxDePage,
} from './html-signals.util';

const liensInternes = (liens: string[], urlDeLaPage: string): string[] => {
  const html = liens.map((href) => `<a href="${href}">lien</a>`).join('');
  return lireSignauxDePage(load(html), html, urlDeLaPage).internalLinks;
};

describe('html-signals.util', () => {
  describe('liens internes', () => {
    it('résout chaque lien sur la page, sans fragment, et écarte ce qui n est pas une page du site', () => {
      expect(
        liensInternes(
          [
            'contact#formulaire',
            '/a-propos',
            '  /services  ',
            'https://example.com/a-propos',
            'https://autre.example.com/page',
            '#haut',
            'mailto:contact@example.com',
            'tel:+33100000000',
            'javascript:void(0)',
            '',
          ],
          'https://example.com/fr/accueil',
        ),
      ).toEqual([
        'https://example.com/fr/contact',
        'https://example.com/a-propos',
        'https://example.com/services',
      ]);
    });

    it('garde les 30 premiers liens', () => {
      const liens = Array.from({ length: 35 }, (_, rang) => `/page-${rang}`);

      expect(liensInternes(liens, 'https://example.com/')).toEqual(
        liens.slice(0, 30).map((chemin) => `https://example.com${chemin}`),
      );
    });

    it('ne rend aucun lien quand l adresse de la page est illisible', () => {
      expect(liensInternes(['/contact'], 'pas une url')).toEqual([]);
    });
  });

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
