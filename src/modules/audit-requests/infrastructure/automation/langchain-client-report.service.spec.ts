import { Logger } from '@nestjs/common';
import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import type { AuditAutomationConfig } from './audit.config';
import {
  ClientReportContext,
  LangchainClientReportService,
} from './langchain-client-report.service';

/**
 * @internal Expose des hooks privees du service pour permettre le spy
 * des methodes internes dans les tests, sans cle OpenAI reelle.
 */
interface ClientReportTestable {
  generate: LangchainClientReportService['generate'];
  buildFallback: (context: ClientReportContext, locale: 'fr' | 'en') => unknown;
}

function asTestable(
  service: LangchainClientReportService,
): ClientReportTestable {
  return service as unknown as ClientReportTestable;
}

describe('LangchainClientReportService', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterAll(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    openAiApiKey: undefined,
    rateHourlyMin: 90,
    rateHourlyMax: 130,
  });

  const baseContext = (): ClientReportContext => ({
    locale: 'fr',
    websiteName: 'example.com',
    normalizedUrl: 'https://example.com',
    pillarScores: {
      seo: 62,
      performance: 55,
      technical: 70,
      trust: 68,
      conversion: 60,
      aiVisibility: 48,
      citationWorthiness: 52,
    },
    findings: [
      {
        title: 'Meta descriptions manquantes',
        description: 'Plusieurs pages commerciales sans meta description.',
        severity: 'high',
        impact: 'traffic',
      },
      {
        title: 'CTA peu visible',
        description:
          'CTA principal difficile a reperer au-dessus de la ligne de flottaison.',
        severity: 'medium',
        impact: 'conversion',
      },
    ],
    quickWins: [
      'Ajouter des meta descriptions orientees intention',
      'Deplacer le CTA principal au-dessus de la ligne de flottaison',
    ],
    aggregateAiSignals: null,
    engineCoverage: null,
  });

  it('returns a deterministic fallback when the api key is missing', async () => {
    const service = new LangchainClientReportService(config);
    const result = await service.generate(baseContext());

    expect(result.executiveSummary.length).toBeGreaterThan(20);
    expect(result.topFindings.length).toBeGreaterThanOrEqual(1);
    expect(result.pillarScorecard).toHaveLength(7);
    expect(result.pillarScorecard.map((pillar) => pillar.pillar)).toEqual([
      'seo',
      'performance',
      'technical',
      'trust',
      'conversion',
      'aiVisibility',
      'citationWorthiness',
    ]);
    expect(result.quickWins.length).toBeGreaterThanOrEqual(3);
    expect(result.quickWins.length).toBeLessThanOrEqual(5);
    expect(result.cta.title.length).toBeGreaterThan(0);
    expect(result.cta.description.length).toBeGreaterThan(0);
    expect(result.cta.actionLabel.length).toBeGreaterThan(0);
  });

  it('preserves source severity verbatim — no inflation low→medium→high→critical (P0.1)', async () => {
    const service = new LangchainClientReportService(config);
    const result = await service.generate(baseContext());
    const top = result.topFindings[0];

    expect(top.severity).toBe('high');
    expect(top.title).toContain('Meta descriptions');

    const second = result.topFindings[1];
    expect(second?.severity).toBe('medium');
  });

  it('computes google vs ai matrix from pillar scores when falling back', async () => {
    const service = new LangchainClientReportService(config);
    const result = await service.generate(baseContext());

    // Google average: seo 62, performance 55, technical 70 => 62
    expect(result.googleVsAiMatrix.googleVisibility.score).toBe(62);
    // AI average: aiVisibility 48, citationWorthiness 52, trust 68 => 56
    expect(result.googleVsAiMatrix.aiVisibility.score).toBe(56);
  });

  it('falls back when the llm call throws', async () => {
    const service = new LangchainClientReportService({
      ...config,
      openAiApiKey: 'test-key',
      llmTimeoutMs: 1_000,
    });
    const testable = asTestable(service);
    const fallbackSpy = jest.spyOn(
      testable as unknown as { buildFallback: (...args: unknown[]) => unknown },
      'buildFallback',
    );

    const result = await service.generate(baseContext());

    expect(fallbackSpy).toHaveBeenCalled();
    expect(result.pillarScorecard).toHaveLength(7);
  }, 30_000);

  it('provides 3 quick wins even when quickWins input is empty', async () => {
    const service = new LangchainClientReportService(config);
    const context = baseContext();
    const empty: ClientReportContext = {
      ...context,
      quickWins: [],
    };
    const result = await service.generate(empty);

    expect(result.quickWins.length).toBeGreaterThanOrEqual(3);
  });
});
