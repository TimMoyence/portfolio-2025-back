export interface AuditAutomationConfig {
  queueEnabled: boolean;
  queueName: string;
  queueConcurrency: number;
  queueAttempts: number;
  queueBackoffMs: number;
  jobTimeoutMs: number;
  redisUrl?: string;
  redisHost?: string;
  redisPort?: number;
  redisUsername?: string;
  redisPassword?: string;
  fetchTimeoutMs: number;
  maxRedirects: number;
  htmlMaxBytes: number;
  textMaxBytes: number;
  sitemapSampleSize: number;
  sitemapMaxUrls: number;
  sitemapAnalyzeLimit: number;
  urlAnalyzeConcurrency: number;
  pageAnalyzeLimit: number;
  pageAiConcurrency: number;
  pageAiTimeoutMs: number;
  llmModel: string;
  llmTimeoutMs: number;
  llmSummaryTimeoutMs: number;
  llmExpertTimeoutMs: number;
  llmRetries: number;
  llmLanguage: string;
  rateHourlyMin: number;
  rateHourlyMax: number;
  rateCurrency: string;
  reportTo?: string;
  openAiApiKey?: string;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envFloat(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = Number.parseFloat(raw ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = (process.env[name] ?? '').toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

function envString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function loadAuditAutomationConfig(): AuditAutomationConfig {
  const rateHourlyMin = Math.max(0, envFloat('AUDIT_RATE_HOURLY_MIN', 80));
  const rateHourlyMax = Math.max(
    rateHourlyMin,
    envFloat('AUDIT_RATE_HOURLY_MAX', 120),
  );
  const llmTimeoutMs = Math.max(1000, envInt('AUDIT_LLM_TIMEOUT_MS', 60_000));
  const llmSummaryTimeoutMs = Math.max(
    1000,
    envInt('AUDIT_LLM_SUMMARY_TIMEOUT_MS', 20_000),
  );
  const llmExpertTimeoutMs = Math.max(
    1000,
    envInt('AUDIT_LLM_EXPERT_TIMEOUT_MS', llmTimeoutMs),
  );

  return {
    queueEnabled: envBool('AUDIT_QUEUE_ENABLED', true),
    queueName: envString('AUDIT_QUEUE_NAME') ?? 'audit_requests',
    queueConcurrency: Math.max(1, envInt('AUDIT_QUEUE_CONCURRENCY', 2)),
    queueAttempts: Math.max(1, envInt('AUDIT_QUEUE_ATTEMPTS', 3)),
    queueBackoffMs: Math.max(0, envInt('AUDIT_QUEUE_BACKOFF_MS', 2000)),
    jobTimeoutMs: Math.max(1000, envInt('AUDIT_JOB_TIMEOUT_MS', 180000)),
    redisUrl: envString('REDIS_URL'),
    redisHost: envString('REDIS_HOST'),
    redisPort: envString('REDIS_PORT')
      ? Math.max(1, envInt('REDIS_PORT', 6379))
      : undefined,
    redisUsername: envString('REDIS_USERNAME'),
    redisPassword: envString('REDIS_PASSWORD'),
    fetchTimeoutMs: Math.max(1000, envInt('AUDIT_FETCH_TIMEOUT_MS', 8000)),
    maxRedirects: Math.max(0, envInt('AUDIT_MAX_REDIRECTS', 5)),
    htmlMaxBytes: Math.max(1024, envInt('AUDIT_HTML_MAX_BYTES', 1_000_000)),
    textMaxBytes: Math.max(1024, envInt('AUDIT_TEXT_MAX_BYTES', 1_000_000)),
    sitemapSampleSize: Math.max(1, envInt('AUDIT_SITEMAP_SAMPLE_SIZE', 10)),
    sitemapMaxUrls: Math.max(10, envInt('AUDIT_SITEMAP_MAX_URLS', 50_000)),
    sitemapAnalyzeLimit: Math.max(
      1,
      envInt('AUDIT_SITEMAP_ANALYZE_LIMIT', 150),
    ),
    urlAnalyzeConcurrency: Math.max(
      1,
      envInt('AUDIT_URL_ANALYZE_CONCURRENCY', 6),
    ),
    pageAnalyzeLimit: Math.max(1, envInt('AUDIT_PAGE_ANALYZE_LIMIT', 30)),
    pageAiConcurrency: Math.max(1, envInt('AUDIT_PAGE_AI_CONCURRENCY', 3)),
    pageAiTimeoutMs: Math.max(1000, envInt('AUDIT_PAGE_AI_TIMEOUT_MS', 8000)),
    llmModel: envString('AUDIT_LLM_MODEL') ?? 'gpt-4o-mini',
    llmTimeoutMs,
    llmSummaryTimeoutMs,
    llmExpertTimeoutMs,
    llmRetries: Math.max(0, envInt('AUDIT_LLM_RETRIES', 2)),
    llmLanguage: envString('AUDIT_LLM_LANGUAGE') ?? 'fr',
    rateHourlyMin,
    rateHourlyMax,
    rateCurrency: envString('AUDIT_RATE_CURRENCY') ?? 'EUR',
    reportTo:
      envString('AUDIT_REPORT_TO') ?? envString('CONTACT_NOTIFICATION_TO'),
    openAiApiKey: envString('OPENAI_API_KEY'),
  };
}
