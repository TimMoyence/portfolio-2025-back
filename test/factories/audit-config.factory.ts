import type { AuditAutomationConfig } from '../../src/modules/audit-requests/infrastructure/automation/audit.config';

/**
 * Construit une config d'automatisation d'audit avec des valeurs par defaut pour les tests.
 *
 * Les valeurs par defaut correspondent aux parametres les plus courants
 * utilises dans les specs automation. Utiliser `overrides` pour ajuster
 * les champs specifiques a un scenario de test.
 */
export function buildAuditAutomationConfig(
  overrides?: Partial<AuditAutomationConfig>,
): AuditAutomationConfig {
  return {
    queueEnabled: true,
    queueName: 'audit_requests',
    queueConcurrency: 1,
    queueAttempts: 1,
    queueBackoffMs: 0,
    jobTimeoutMs: 60_000,
    fetchTimeoutMs: 5_000,
    maxRedirects: 5,
    htmlMaxBytes: 1_000_000,
    textMaxBytes: 1_000_000,
    sitemapSampleSize: 10,
    sitemapMaxUrls: 50_000,
    sitemapAnalyzeLimit: 150,
    urlAnalyzeConcurrency: 6,
    pageAnalyzeLimit: 30,
    pageAiConcurrency: 3,
    pageAiTimeoutMs: 8_000,
    llmModel: 'gpt-4o-mini',
    llmTimeoutMs: 25_000,
    llmSummaryTimeoutMs: 20_000,
    llmExpertTimeoutMs: 60_000,
    llmProfile: 'parallel_sections_v1',
    llmProfileCanaryPercent: 100,
    llmGlobalTimeoutMs: 45_000,
    llmSectionTimeoutMs: 18_000,
    llmSectionRetryMax: 1,
    llmSectionRetryMinRemainingMs: 8_000,
    llmInflightMax: 8,
    llmRetries: 0,
    llmLanguage: 'fr',
    pageAiCircuitBreakerMinSamples: 6,
    pageAiCircuitBreakerFailureRatio: 0.5,
    rateHourlyMin: 80,
    rateHourlyMax: 120,
    rateCurrency: 'EUR',
    ...overrides,
  };
}
