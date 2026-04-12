import {
  RequestScoringContext,
  scoreRequest,
} from './suspicious-request-scorer';

function ctx(
  overrides: Partial<RequestScoringContext> = {},
): RequestScoringContext {
  return {
    method: 'GET',
    path: '/api/v1/portfolio25/auth/me',
    statusCode: 200,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
    acceptLanguage: 'fr-FR,fr;q=0.9',
    referer: 'https://asilidesign.fr/fr/',
    responseTimeMs: 35,
    aborted: false,
    rateLimitHit: false,
    ...overrides,
  };
}

describe('scoreRequest', () => {
  it('retourne un score 0 pour une requete Safari legitime', () => {
    const result = scoreRequest(ctx());
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it("flague HeadlessChrome meme avec referer d'apparence legitime", () => {
    const result = scoreRequest(
      ctx({
        method: 'POST',
        path: '/api/v1/portfolio25/cookie-consents',
        statusCode: 201,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeadlessChrome/145 Safari/537.36',
        aborted: true,
        responseTimeMs: 31,
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(45);
    expect(result.reasons).toContain('ua:headless-chrome');
    expect(result.reasons).toContain('http:aborted');
  });

  it('flague un UA absent', () => {
    const result = scoreRequest(ctx({ userAgent: '' }));
    expect(result.reasons).toContain('ua:missing');
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it('flague curl / python-requests / wget', () => {
    expect(scoreRequest(ctx({ userAgent: 'curl/7.88.0' })).reasons).toContain(
      'ua:curl',
    );
    expect(
      scoreRequest(ctx({ userAgent: 'python-requests/2.32.3' })).reasons,
    ).toContain('ua:python-requests');
    expect(scoreRequest(ctx({ userAgent: 'Wget/1.21.4' })).reasons).toContain(
      'ua:wget',
    );
  });

  it('detecte les scans de vulnerabilites PHP / wp-admin / .env', () => {
    expect(
      scoreRequest(ctx({ path: '/wp-login.php', statusCode: 404 })).reasons,
    ).toContain('path:wordpress-login');
    expect(
      scoreRequest(ctx({ path: '/.env', statusCode: 404 })).reasons,
    ).toContain('path:env-file');
    expect(
      scoreRequest(ctx({ path: '/admin/index.php', statusCode: 404 })).reasons,
    ).toContain('path:php-script');
    expect(
      scoreRequest(ctx({ path: '/../../etc/passwd', statusCode: 400 })).reasons,
    ).toContain('path:traversal');
  });

  it('flague les 4xx sur les endpoints sensibles en ecriture', () => {
    const result = scoreRequest(
      ctx({
        method: 'POST',
        path: '/api/v1/portfolio25/auth/login',
        statusCode: 401,
      }),
    );
    expect(result.reasons).toContain('sensitive:write-4xx');
  });

  it('ne flague pas un 4xx sur un endpoint de lecture', () => {
    const result = scoreRequest(
      ctx({
        method: 'GET',
        path: '/api/v1/portfolio25/auth/me',
        statusCode: 401,
      }),
    );
    expect(result.reasons).not.toContain('sensitive:write-4xx');
  });

  it('flague rate-limit-hit a la fois via flag et via status 429', () => {
    expect(scoreRequest(ctx({ rateLimitHit: true })).reasons).toContain(
      'rate-limit:hit',
    );
    expect(scoreRequest(ctx({ statusCode: 429 })).reasons).toContain(
      'rate-limit:hit',
    );
  });

  it('plafonne a 100', () => {
    const result = scoreRequest(
      ctx({
        method: 'POST',
        path: '/wp-admin/../.env',
        userAgent: 'HeadlessChrome/145',
        statusCode: 429,
        aborted: true,
      }),
    );
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('score additif croissant avec plusieurs signaux', () => {
    const single = scoreRequest(
      ctx({ userAgent: 'curl/7.0', statusCode: 200 }),
    );
    const multi = scoreRequest(
      ctx({
        userAgent: 'curl/7.0',
        statusCode: 429,
        aborted: true,
      }),
    );
    expect(multi.score).toBeGreaterThan(single.score);
  });
});
