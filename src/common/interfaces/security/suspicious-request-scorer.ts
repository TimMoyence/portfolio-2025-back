export interface RequestScoringContext {
  method: string;
  path: string;
  statusCode: number;
  userAgent: string;
  acceptLanguage: string;
  referer: string;
  responseTimeMs: number;
  aborted: boolean;
  rateLimitHit: boolean;
}

export interface RequestScore {
  score: number;
  reasons: string[];
}

const AUTOMATION_UA_PATTERNS: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /HeadlessChrome/i, reason: 'ua:headless-chrome' },
  { pattern: /PhantomJS/i, reason: 'ua:phantomjs' },
  { pattern: /Selenium/i, reason: 'ua:selenium' },
  { pattern: /Puppeteer/i, reason: 'ua:puppeteer' },
  { pattern: /Playwright/i, reason: 'ua:playwright' },
  { pattern: /curl\//i, reason: 'ua:curl' },
  { pattern: /wget/i, reason: 'ua:wget' },
  { pattern: /python-requests/i, reason: 'ua:python-requests' },
  { pattern: /Go-http-client/i, reason: 'ua:go-http' },
  { pattern: /node-fetch/i, reason: 'ua:node-fetch' },
  { pattern: /Java\//i, reason: 'ua:java' },
  { pattern: /libwww-perl/i, reason: 'ua:perl' },
  { pattern: /^Mozilla\/5\.0 \(compatible;/, reason: 'ua:compatible-bot' },
  { pattern: /\bBot\b/i, reason: 'ua:bot-label' },
  { pattern: /crawler/i, reason: 'ua:crawler' },
  { pattern: /spider/i, reason: 'ua:spider' },
  { pattern: /scanner/i, reason: 'ua:scanner' },
];

const SENSITIVE_WRITE_PATHS: readonly RegExp[] = [
  /^\/api\/v\d+\/portfolio25\/auth\//,
  /^\/api\/v\d+\/portfolio25\/users/,
  /^\/api\/v\d+\/portfolio25\/contacts/,
  /^\/api\/v\d+\/portfolio25\/lead-magnets/,
];

const SUSPICIOUS_PATH_PATTERNS: readonly { pattern: RegExp; reason: string }[] =
  [
    { pattern: /\.\./, reason: 'path:traversal' },
    { pattern: /\/\.env/i, reason: 'path:env-file' },
    { pattern: /\/\.git/i, reason: 'path:git-dir' },
    { pattern: /\/wp-admin/i, reason: 'path:wordpress-admin' },
    { pattern: /\/wp-login/i, reason: 'path:wordpress-login' },
    { pattern: /\/phpmyadmin/i, reason: 'path:phpmyadmin' },
    { pattern: /\.php(\?|$)/i, reason: 'path:php-script' },
    { pattern: /\.(aspx?|jsp)(\?|$)/i, reason: 'path:legacy-server-script' },
    { pattern: /\/etc\/passwd/i, reason: 'path:passwd-disclosure' },
    { pattern: /\/server-status/i, reason: 'path:server-status' },
    { pattern: /\/\.well-known\/security/i, reason: 'path:well-known-probe' },
  ];

const WRITE_METHODS: ReadonlySet<string> = new Set([
  'POST',
  'PATCH',
  'PUT',
  'DELETE',
]);

const MAX_SCORE = 100;
const ULTRA_FAST_MS = 50;

function firstMatchingReason(
  patterns: readonly { pattern: RegExp; reason: string }[],
  value: string,
): string | null {
  return patterns.find(({ pattern }) => pattern.test(value))?.reason ?? null;
}

function weigh(score: number, reason: string | null): RequestScore {
  return reason ? { score, reasons: [reason] } : { score: 0, reasons: [] };
}

function scoreUserAgent(userAgent: string): RequestScore {
  const ua = userAgent.trim();
  if (ua.length === 0) return { score: 20, reasons: ['ua:missing'] };
  return weigh(30, firstMatchingReason(AUTOMATION_UA_PATTERNS, ua));
}

function scorePath(path: string): RequestScore {
  return weigh(40, firstMatchingReason(SUSPICIOUS_PATH_PATTERNS, path));
}

function scoreRateLimit(ctx: RequestScoringContext): RequestScore {
  const hit = ctx.rateLimitHit || ctx.statusCode === 429;
  return weigh(30, hit ? 'rate-limit:hit' : null);
}

function scoreAbort(ctx: RequestScoringContext): RequestScore {
  return weigh(15, ctx.aborted ? 'http:aborted' : null);
}

function scoreUltraFastWrite(ctx: RequestScoringContext): RequestScore {
  const ultraFast =
    ctx.responseTimeMs > 0 &&
    ctx.responseTimeMs < ULTRA_FAST_MS &&
    !ctx.aborted;
  const writeLike = ctx.method !== 'GET' && ctx.method !== 'HEAD';
  return weigh(5, ultraFast && writeLike ? 'http:ultra-fast-write' : null);
}

function scoreSensitiveWrite(ctx: RequestScoringContext): RequestScore {
  const clientError = ctx.statusCode >= 400 && ctx.statusCode < 500;
  const flagged =
    WRITE_METHODS.has(ctx.method) &&
    clientError &&
    SENSITIVE_WRITE_PATHS.some((re) => re.test(ctx.path));
  return weigh(15, flagged ? 'sensitive:write-4xx' : null);
}

function scoreMissingAcceptLanguage(ctx: RequestScoringContext): RequestScore {
  const missing =
    ctx.acceptLanguage.trim().length === 0 && ctx.method === 'GET';
  return weigh(5, missing ? 'header:no-accept-language' : null);
}

export function scoreRequest(ctx: RequestScoringContext): RequestScore {
  const signals = [
    scoreUserAgent(ctx.userAgent),
    scorePath(ctx.path),
    scoreRateLimit(ctx),
    scoreAbort(ctx),
    scoreUltraFastWrite(ctx),
    scoreSensitiveWrite(ctx),
    scoreMissingAcceptLanguage(ctx),
  ];

  const total = signals.reduce((sum, signal) => sum + signal.score, 0);

  return {
    score: Math.min(total, MAX_SCORE),
    reasons: signals.flatMap((signal) => signal.reasons),
  };
}
