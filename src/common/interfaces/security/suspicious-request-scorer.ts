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
  /^\/api\/v[0-9]+\/portfolio25\/auth\//,
  /^\/api\/v[0-9]+\/portfolio25\/users/,
  /^\/api\/v[0-9]+\/portfolio25\/contacts/,
  /^\/api\/v[0-9]+\/portfolio25\/lead-magnets/,
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

export function scoreRequest(ctx: RequestScoringContext): RequestScore {
  const reasons: string[] = [];
  let score = 0;

  const ua = ctx.userAgent.trim();
  if (ua.length === 0) {
    score += 20;
    reasons.push('ua:missing');
  } else {
    for (const { pattern, reason } of AUTOMATION_UA_PATTERNS) {
      if (pattern.test(ua)) {
        score += 30;
        reasons.push(reason);
        break;
      }
    }
  }

  for (const { pattern, reason } of SUSPICIOUS_PATH_PATTERNS) {
    if (pattern.test(ctx.path)) {
      score += 40;
      reasons.push(reason);
      break;
    }
  }

  if (ctx.rateLimitHit || ctx.statusCode === 429) {
    score += 30;
    reasons.push('rate-limit:hit');
  }

  if (ctx.aborted) {
    score += 15;
    reasons.push('http:aborted');
  }

  if (ctx.responseTimeMs > 0 && ctx.responseTimeMs < 50 && !ctx.aborted) {
    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
      score += 5;
      reasons.push('http:ultra-fast-write');
    }
  }

  const writeMethods = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
  if (
    writeMethods.has(ctx.method) &&
    ctx.statusCode >= 400 &&
    ctx.statusCode < 500 &&
    SENSITIVE_WRITE_PATHS.some((re) => re.test(ctx.path))
  ) {
    score += 15;
    reasons.push('sensitive:write-4xx');
  }

  if (ctx.acceptLanguage.trim().length === 0 && ctx.method === 'GET') {
    score += 5;
    reasons.push('header:no-accept-language');
  }

  if (score > 100) score = 100;

  return { score, reasons };
}
