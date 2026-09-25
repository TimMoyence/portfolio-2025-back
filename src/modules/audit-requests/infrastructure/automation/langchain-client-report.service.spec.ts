import { silenceNestLogger } from '../../../../../test/helpers/silence-nest-logger';
import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import { buildClientReportContext } from '../../../../../test/factories/audit-requests.factory';
import type { AuditAutomationConfig } from './audit.config';
import {
  ClientReportContext,
  LangchainClientReportService,
} from './langchain-client-report.service';

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
  silenceNestLogger();

  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    openAiApiKey: undefined,
    rateHourlyMin: 90,
    rateHourlyMax: 130,
  });

  const baseContext = (): ClientReportContext =>
    buildClientReportContext({
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
    });

  it('returns a deterministic fallback when the api key is missing', async () => {
    const service = new LangchainClientReportService(config);
    const result = await service.generate(baseContext());

    expect(result.executiveSummary.length).toBeGreaterThan(20);
    expect(result.topFindings.length).toBeGreaterThanOrEqual(1);
    expect(result.pillarScorecard).toHaveLength(7);
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
