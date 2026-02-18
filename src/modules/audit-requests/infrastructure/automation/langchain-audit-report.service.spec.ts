import { Logger } from '@nestjs/common';
import type { AuditAutomationConfig } from './audit.config';
import {
  LangchainAuditInput,
  LangchainAuditReportService,
} from './langchain-audit-report.service';
import { ReportQualityGateService } from './report-quality-gate.service';

describe('LangchainAuditReportService', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      return undefined;
    });
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {
      return undefined;
    });
  });

  afterAll(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  const config: AuditAutomationConfig = {
    queueEnabled: true,
    queueName: 'audit_requests',
    queueConcurrency: 1,
    queueAttempts: 1,
    queueBackoffMs: 0,
    jobTimeoutMs: 60_000,
    fetchTimeoutMs: 8_000,
    maxRedirects: 5,
    htmlMaxBytes: 1_000_000,
    textMaxBytes: 1_000_000,
    sitemapSampleSize: 10,
    sitemapMaxUrls: 50_000,
    sitemapAnalyzeLimit: 150,
    urlAnalyzeConcurrency: 6,
    pageAnalyzeLimit: 30,
    pageAiConcurrency: 3,
    pageAiTimeoutMs: 8000,
    llmModel: 'gpt-4o-mini',
    llmTimeoutMs: 25_000,
    llmSummaryTimeoutMs: 20_000,
    llmExpertTimeoutMs: 60_000,
    llmRetries: 0,
    llmLanguage: 'fr',
    rateHourlyMin: 90,
    rateHourlyMax: 130,
    rateCurrency: 'EUR',
    openAiApiKey: undefined,
  };

  const input: LangchainAuditInput = {
    locale: 'fr',
    websiteName: 'example.com',
    normalizedUrl: 'https://example.com',
    keyChecks: { accessibility: { https: true } },
    quickWins: [
      'Ajouter des meta descriptions sur les pages clés',
      'Corriger les canonicals manquantes',
      'Réduire le TTFB des pages les plus lentes',
    ],
    pillarScores: {
      seo: 72,
      performance: 60,
      technical: 68,
      trust: 74,
      conversion: 65,
    },
    deepFindings: [
      {
        code: 'missing_meta_description',
        title: 'Meta descriptions manquantes',
        description: 'Plusieurs pages n’ont pas de meta description.',
        severity: 'high',
        confidence: 0.9,
        impact: 'traffic',
        affectedUrls: ['https://example.com/a'],
        recommendation: 'Ajouter des metas uniques orientées intention.',
      },
    ],
    sampledUrls: [
      {
        url: 'https://example.com/a',
        statusCode: 200,
        indexable: true,
        canonical: 'https://example.com/a',
        title: 'Page A',
        metaDescription: null,
        h1Count: 1,
        htmlLang: 'fr',
        canonicalCount: 1,
        responseTimeMs: 1400,
        error: null,
      },
    ],
    pageRecaps: [
      {
        url: 'https://example.com/a',
        priority: 'high',
        wordingScore: 60,
        trustScore: 55,
        ctaScore: 50,
        seoCopyScore: 58,
        topIssues: ['Missing CTA'],
        recommendations: ['Add primary CTA block'],
        source: 'fallback',
      },
    ],
    pageSummary: {
      totalPages: 1,
      llmRecaps: 0,
      fallbackRecaps: 1,
      priorityCounts: { high: 1, medium: 0, low: 0 },
      averageScores: { wording: 60, trust: 55, cta: 50, seoCopy: 58 },
      topRecurringIssues: ['missing cta'],
    },
  };

  it('returns deterministic fallback with cost estimate when api key is missing', async () => {
    const service = new LangchainAuditReportService(
      config,
      new ReportQualityGateService(),
    );
    const result = await service.generate(input);
    const admin = result.adminReport;
    const cost = admin['costEstimate'] as Record<string, unknown>;

    expect(result.summaryText.length).toBeGreaterThan(50);
    expect(admin['executiveSummary']).toBeDefined();
    expect(admin['clientLongEmail']).toBeDefined();
    expect(admin['fastImplementationPlan']).toBeInstanceOf(Array);
    expect(cost['currency']).toBe('EUR');
    expect(cost['hourlyRateMin']).toBe(90);
    expect(cost['hourlyRateMax']).toBe(130);
    expect(admin['qualityGate']).toBeDefined();
    expect(Number(cost['estimatedCostMax'])).toBeGreaterThanOrEqual(
      Number(cost['estimatedCostMin']),
    );
  });

  it('keeps client summary and uses expert fallback when compact expert times out', async () => {
    const service = new LangchainAuditReportService(
      {
        ...config,
        openAiApiKey: 'test-key',
      },
      new ReportQualityGateService(),
    );

    jest
      .spyOn(
        service as unknown as { generateUserSummary: () => Promise<string> },
        'generateUserSummary',
      )
      .mockResolvedValue('Summary generated.');
    const timeoutError = new Error('TimeoutError: Request timed out.');
    jest
      .spyOn(
        service as unknown as { generateExpertReport: () => Promise<unknown> },
        'generateExpertReport',
      )
      .mockRejectedValue(timeoutError);

    const result = await service.generate(input);
    const qualityGate = result.adminReport['qualityGate'] as Record<
      string,
      unknown
    >;

    expect(result.summaryText).toContain('Summary generated.');
    expect(qualityGate['fallback']).toBe(true);
    expect(qualityGate['retried']).toBe(false);
  });

  it('runs full expert pass only after compact success when quality gate is weak', async () => {
    const applyMock = jest.fn<
      ReturnType<ReportQualityGateService['apply']>,
      Parameters<ReportQualityGateService['apply']>
    >();
    applyMock
      .mockImplementationOnce((summaryText, report) => ({
        summaryText,
        report,
        valid: false,
        reasons: ['language_mismatch_detected'],
      }))
      .mockImplementationOnce((summaryText, report) => ({
        summaryText,
        report,
        valid: true,
        reasons: [],
      }));

    const qualityGate = {
      apply: applyMock,
    } as unknown as ReportQualityGateService;

    const service = new LangchainAuditReportService(
      {
        ...config,
        openAiApiKey: 'test-key',
      },
      qualityGate,
    );

    const compactReport = (
      service as unknown as {
        buildFallbackExpertReport: (
          inputValue: LangchainAuditInput,
          reason: string,
        ) => Record<string, unknown>;
      }
    ).buildFallbackExpertReport(input, 'compact');
    const fullReport = (
      service as unknown as {
        buildFallbackExpertReport: (
          inputValue: LangchainAuditInput,
          reason: string,
        ) => Record<string, unknown>;
      }
    ).buildFallbackExpertReport(input, 'full');
    jest
      .spyOn(
        service as unknown as { generateUserSummary: () => Promise<string> },
        'generateUserSummary',
      )
      .mockResolvedValue('Summary generated.');
    const expertSpy = jest
      .spyOn(
        service as unknown as { generateExpertReport: () => Promise<unknown> },
        'generateExpertReport',
      )
      .mockResolvedValueOnce(compactReport)
      .mockResolvedValueOnce(fullReport);

    const result = await service.generate(input);
    const qualityGateResult = result.adminReport['qualityGate'] as Record<
      string,
      unknown
    >;

    expect(expertSpy).toHaveBeenCalledTimes(2);
    expect(qualityGateResult['retried']).toBe(true);
    expect(qualityGateResult['fallback']).toBe(false);
    expect(qualityGateResult['valid']).toBe(true);
  });
});
