/* eslint-disable @typescript-eslint/unbound-method */
import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import { buildLangchainAuditInput } from '../../../../../test/factories/audit-requests.factory';
import { createLlmSuiviStub } from '../../../../../test/factories/section-generator.factory';
import { silenceNestLogger } from '../../../../../test/helpers/silence-nest-logger';
import type { MetricsService } from '../../../../common/interfaces/metrics/metrics.service';
import type { AuditAutomationConfig } from './audit.config';
import {
  type ChatOpenAIFactory,
  DefaultChatOpenAIFactory,
} from './chat-openai.factory';
import {
  type ExpertReport,
  LangchainAuditInput,
  LangchainAuditReportService,
} from './langchain-audit-report.service';
import { DeadlineBudget } from './llm-execution.guardrails';
import { SharedLlmExecutor } from './llm-executor.port';
import { ReportQualityGateService } from './report-quality-gate.service';
import { CachingSectionRunner } from './section-generators';

function createService(
  config: AuditAutomationConfig,
  qualityGate: ReportQualityGateService,
  llm: { fabrique?: ChatOpenAIFactory; metrics?: MetricsService } = {},
): LangchainAuditReportService {
  return new LangchainAuditReportService(
    config,
    qualityGate,
    llm.fabrique ?? new DefaultChatOpenAIFactory(config),
    new SharedLlmExecutor(config),
    new CachingSectionRunner(config),
    llm.metrics,
  );
}

type ChargesDeSection = Record<
  | 'executiveSection'
  | 'prioritySection'
  | 'executionSection'
  | 'clientCommsSection',
  Record<string, unknown>
>;

interface LangchainServiceTestable {
  generate: LangchainAuditReportService['generate'];
  generateUserSummary: (...args: unknown[]) => Promise<string>;
  generateExpertReport: (...args: unknown[]) => Promise<ExpertReport>;
  generateSummaryWithDeadline: (...args: unknown[]) => Promise<{
    summaryText: string;
    warnings: Array<{ type: 'summary' | 'expert'; message: string }>;
  }>;
  buildFallbackExpertReport: (
    inputValue: LangchainAuditInput,
    reason: string,
  ) => ExpertReport;
  buildSectionPayloads: (inputValue: LangchainAuditInput) => ChargesDeSection;
  generateSectionOnce: (
    llm: unknown,
    section: string,
    payload: Record<string, unknown>,
    locale: string,
    retryMode: boolean,
    budget: unknown,
    options: unknown,
  ) => Promise<unknown>;
  generateFanoutSectionsWithDeadline: (
    llm: unknown,
    payloads: ChargesDeSection,
    locale: 'fr' | 'en',
    inputValue: LangchainAuditInput,
    budget: DeadlineBudget,
    options?: unknown,
  ) => Promise<Record<string, unknown>>;
}

describe('LangchainAuditReportService', () => {
  silenceNestLogger();

  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    fetchTimeoutMs: 8_000,
    llmProfile: 'stability_first_sequential',
    rateHourlyMin: 90,
    rateHourlyMax: 130,
    openAiApiKey: undefined,
  });

  const input: LangchainAuditInput = buildLangchainAuditInput();

  function asTestable(
    service: LangchainAuditReportService,
  ): LangchainServiceTestable {
    return service as unknown as LangchainServiceTestable;
  }

  const genererEnRepli = () =>
    createService(config, new ReportQualityGateService()).generate(input);

  it('returns deterministic fallback with cost estimate when api key is missing', async () => {
    const result = await genererEnRepli();
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

  it('projects an ExpertReportSynthesis with the 3 new fields in fallback mode', async () => {
    const result = await genererEnRepli();

    expect(result.expertSynthesis).toBeDefined();
    expect(result.expertSynthesis.perPageAnalysis.length).toBeGreaterThan(0);
    expect(
      result.expertSynthesis.clientEmailDraft.subject.length,
    ).toBeGreaterThan(0);
    expect(result.expertSynthesis.clientEmailDraft.body.length).toBeGreaterThan(
      200,
    );
    expect(result.expertSynthesis.internalNotes.length).toBeGreaterThan(10);
    expect(result.expertSynthesis.crossPageFindings.length).toBeGreaterThan(0);
    expect(result.expertSynthesis.executiveSummary.length).toBeGreaterThan(0);
  });

  it('includes perPageAnalysis and clientEmailDraft in the adminReport fallback', async () => {
    const result = await genererEnRepli();
    const admin = result.adminReport;

    expect(admin['perPageAnalysis']).toBeInstanceOf(Array);
    expect((admin['perPageAnalysis'] as unknown[]).length).toBeGreaterThan(0);
    const draft = admin['clientEmailDraft'] as {
      subject: string;
      body: string;
    };
    expect(draft.subject.length).toBeGreaterThan(0);
    expect(draft.body.length).toBeGreaterThan(200);
    expect(typeof admin['internalNotes']).toBe('string');
    expect((admin['internalNotes'] as string).length).toBeGreaterThan(10);
  });

  function gateToujoursInvalide(): ReportQualityGateService {
    const gate = new ReportQualityGateService();
    const appliquer = gate.apply.bind(gate);
    jest.spyOn(gate, 'apply').mockImplementation((...args) => ({
      ...appliquer(...args),
      valid: false,
      reasons: ['language_mismatch_detected'],
    }));
    return gate;
  }

  const AVERTISSEMENT_DE_GATE =
    'Sortie normalisee apres echec du quality gate.';

  it('signale la gate invalide aussi en repli', async () => {
    const result = await createService(config, gateToujoursInvalide()).generate(
      input,
    );

    expect(result.adminReport['qualityWarning']).toBe(AVERTISSEMENT_DE_GATE);
    expect(
      (result.adminReport['qualityGate'] as Record<string, unknown>)[
        'fallback'
      ],
    ).toBe(true);
  });

  const PROFILS_SIMULES = [
    [
      'stability_first_sequential',
      (testable: LangchainServiceTestable, rapport: ExpertReport) => {
        jest
          .spyOn(testable, 'generateUserSummary')
          .mockResolvedValue('Summary generated.');
        jest.spyOn(testable, 'generateExpertReport').mockResolvedValue(rapport);
      },
    ],
    [
      'parallel_sections_v1',
      (testable: LangchainServiceTestable, rapport: ExpertReport) => {
        jest.spyOn(testable, 'generateSummaryWithDeadline').mockResolvedValue({
          summaryText: 'Summary generated.',
          warnings: [],
        });
        jest
          .spyOn(testable, 'generateFanoutSectionsWithDeadline')
          .mockResolvedValue({
            report: rapport,
            failedSections: [],
            retryCount: 0,
            usedFallback: false,
            warnings: [],
          });
      },
    ],
  ] as const;

  type ProfilSimule = (typeof PROFILS_SIMULES)[number];

  async function genererAvecLeLlm(
    [profil, simulerLeLlm]: ProfilSimule,
    qualityGate: ReportQualityGateService,
    alterer: (rapport: ExpertReport) => ExpertReport = (rapport) => rapport,
  ) {
    const service = createService(
      { ...config, openAiApiKey: 'test-key', llmProfile: profil },
      qualityGate,
    );
    const testable = asTestable(service);
    simulerLeLlm(
      testable,
      alterer(testable.buildFallbackExpertReport(input, 'llm')),
    );
    return service.generate(input);
  }

  it.each(PROFILS_SIMULES)(
    'signale la gate invalide et décrit le profil %s',
    async (...profil) => {
      const result = await genererAvecLeLlm(profil, gateToujoursInvalide());

      expect(result.adminReport['qualityWarning']).toBe(AVERTISSEMENT_DE_GATE);
      expect(result.adminReport['llmMeta']).toEqual(
        expect.objectContaining({ profile: profil[0] }),
      );
    },
  );

  const SYNTHESE_DU_LLM = 'Synthese redigee par le LLM.';

  const genererSousLaVraieGate = (
    profil: ProfilSimule,
    alterations: Partial<ExpertReport> = {},
  ) =>
    genererAvecLeLlm(profil, new ReportQualityGateService(), (rapport) => ({
      ...rapport,
      executiveSummary: SYNTHESE_DU_LLM,
      ...alterations,
    }));

  it.each(PROFILS_SIMULES)(
    'garde le rapport expert du profil %s qui respecte les validateurs de palier',
    async (...profil) => {
      const result = await genererSousLaVraieGate(profil);

      expect(result.adminReport['executiveSummary']).toBe(SYNTHESE_DU_LLM);
      expect(result.adminReport['qualityGate']).toEqual(
        expect.objectContaining({ fallback: false }),
      );
    },
  );

  it.each(PROFILS_SIMULES)(
    'bascule sur le repli quand le rapport expert du profil %s enfreint les validateurs de palier',
    async (...profil) => {
      const result = await genererSousLaVraieGate(profil, {
        perPageAnalysis: [],
        internalNotes: '',
      });
      const admin = result.adminReport;

      expect(result.summaryText).toBe('Summary generated.');
      expect(admin['executiveSummary']).not.toBe(SYNTHESE_DU_LLM);
      expect((admin['perPageAnalysis'] as unknown[]).length).toBeGreaterThan(0);
      expect(admin['internalNotes']).not.toBe('');
      expect(admin['reason']).toEqual(
        expect.stringContaining('expert_report_per_page_analysis_missing'),
      );
      expect(admin['qualityGate']).toEqual(
        expect.objectContaining({ fallback: true }),
      );
    },
  );

  it('ne relance qu un passage expert complet, compté, quand le rapport compact enfreint le palier', async () => {
    const invoke = jest.fn();
    const { fabrique, metrics } = createLlmSuiviStub(invoke);
    const service = createService(
      { ...config, openAiApiKey: 'test-key' },
      new ReportQualityGateService(),
      { fabrique, metrics },
    );
    const testable = asTestable(service);
    jest
      .spyOn(testable, 'generateUserSummary')
      .mockResolvedValue('Summary generated.');
    invoke.mockResolvedValue({
      ...testable.buildFallbackExpertReport(input, 'llm'),
      perPageAnalysis: [],
    });

    const result = await service.generate(input);

    const appelExpert = expect.objectContaining({
      section: 'expert_report',
      status: 'success',
    });
    expect(metrics.llmCallsTotal.inc).toHaveBeenCalledTimes(2);
    expect(metrics.llmCallsTotal.inc).toHaveBeenNthCalledWith(1, appelExpert);
    expect(metrics.llmCallsTotal.inc).toHaveBeenNthCalledWith(2, appelExpert);
    expect(result.adminReport['qualityGate']).toEqual(
      expect.objectContaining({ retried: true, fallback: true }),
    );
  });

  it('keeps client summary and uses expert fallback when compact expert times out', async () => {
    const service = createService(
      { ...config, openAiApiKey: 'test-key' },
      new ReportQualityGateService(),
    );

    const testable = asTestable(service);
    jest
      .spyOn(testable, 'generateUserSummary')
      .mockResolvedValue('Summary generated.');
    const timeoutError = new Error('TimeoutError: Request timed out.');
    jest
      .spyOn(testable, 'generateExpertReport')
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
        repli: false,
      }))
      .mockImplementationOnce((summaryText, report) => ({
        summaryText,
        report,
        valid: true,
        reasons: [],
        repli: false,
      }));

    const qualityGate = {
      apply: applyMock,
    } as unknown as ReportQualityGateService;

    const service = createService(
      { ...config, openAiApiKey: 'test-key' },
      qualityGate,
    );

    const testable = asTestable(service);
    const compactReport = testable.buildFallbackExpertReport(input, 'compact');
    const fullReport = testable.buildFallbackExpertReport(input, 'full');
    jest
      .spyOn(testable, 'generateUserSummary')
      .mockResolvedValue('Summary generated.');
    const expertSpy = jest
      .spyOn(testable, 'generateExpertReport')
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

  it('retries one failed fan-out section once when budget allows', async () => {
    const service = createService(
      {
        ...config,
        openAiApiKey: 'test-key',
        llmProfile: 'parallel_sections_v1',
        llmSectionRetryMax: 1,
        llmSectionRetryMinRemainingMs: 1000,
      },
      new ReportQualityGateService(),
    );
    const testable = asTestable(service);
    const payloads = testable.buildSectionPayloads(input);
    const fallbackReport = testable.buildFallbackExpertReport(input, 'seed');
    const calls: Record<string, number> = {};

    jest
      .spyOn(testable, 'generateSectionOnce')
      .mockImplementation((_llm, section) => {
        calls[section] = (calls[section] ?? 0) + 1;
        if (section === 'prioritySection' && calls[section] === 1) {
          return Promise.reject(new Error('TimeoutError: Request timed out.'));
        }
        if (section === 'executiveSection') {
          return Promise.resolve({
            executiveSummary: 'Summary',
            reportExplanation: 'Explanation',
            strengths: [],
          });
        }
        if (section === 'prioritySection') {
          return Promise.resolve({
            priorities: fallbackReport['priorities'],
            urlLevelImprovements: fallbackReport['urlLevelImprovements'],
          });
        }
        if (section === 'executionSection') {
          return Promise.resolve({
            implementationTodo: fallbackReport['implementationTodo'],
            whatToFixThisWeek: fallbackReport['whatToFixThisWeek'],
            whatToFixThisMonth: fallbackReport['whatToFixThisMonth'],
            fastImplementationPlan: fallbackReport['fastImplementationPlan'],
            implementationBacklog: fallbackReport['implementationBacklog'],
            invoiceScope: fallbackReport['invoiceScope'],
          });
        }
        return Promise.resolve({
          clientMessageTemplate: fallbackReport['clientMessageTemplate'],
          clientLongEmail: fallbackReport['clientLongEmail'],
        });
      });

    const sectionResult = await testable.generateFanoutSectionsWithDeadline(
      {},
      payloads,
      'fr',
      input,
      DeadlineBudget.fromNow(45_000),
    );

    expect(calls['prioritySection']).toBe(2);
    expect(sectionResult['retryCount']).toBe(1);
    expect(sectionResult['usedFallback']).toBe(false);
    expect(sectionResult['failedSections']).toEqual([]);
  });
});
