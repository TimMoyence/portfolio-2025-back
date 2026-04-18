import { Logger } from '@nestjs/common';
import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import { buildLangchainAuditInput } from '../../../../../test/factories/audit-requests.factory';
import type { AnthropicChatFactory } from './anthropic-chat.factory';
import type { AuditAutomationConfig } from './audit.config';
import { DefaultChatOpenAIFactory } from './chat-openai.factory';
import {
  type ExpertReport,
  LangchainAuditInput,
  LangchainAuditReportService,
} from './langchain-audit-report.service';
import { DeadlineBudget } from './llm-execution.guardrails';
import { SharedLlmExecutor } from './llm-executor.port';
import { ReportQualityGateService } from './report-quality-gate.service';
import { CachingSectionRunner } from './section-generators';

/**
 * Helper local : instancie le service avec les dependances par defaut
 * (factory ChatOpenAI + executor partage) pour garder les tests lisibles
 * apres l'ajout des ports LLM en C4a. Chaque test injecte son propre
 * config/qualityGate.
 */
function createService(
  config: AuditAutomationConfig,
  qualityGate: ReportQualityGateService,
  anthropicChatFactory?: AnthropicChatFactory,
): LangchainAuditReportService {
  const cachingRunner = new CachingSectionRunner(
    config,
    undefined,
    anthropicChatFactory,
  );
  return new LangchainAuditReportService(
    config,
    qualityGate,
    new DefaultChatOpenAIFactory(config),
    new SharedLlmExecutor(config),
    cachingRunner,
    undefined,
  );
}

/**
 * @internal Interface de test exposant les methodes privees du service LangchainAuditReport.
 *
 * Justification : les methodes privees (generateUserSummary, generateExpertReport,
 * buildFallbackExpertReport, buildSectionPayloads, generateSectionOnce,
 * generateFanoutSectionsWithDeadline) orchestrent les appels LLM. Les tester
 * via l'interface publique generate() necessiterait une cle OpenAI reelle et
 * rendrait les tests non deterministes. Ce type permet un acces controle
 * pour le mock et le spy des couches internes uniquement en contexte de test.
 */
interface LangchainServiceTestable {
  generate: LangchainAuditReportService['generate'];
  generateUserSummary: (...args: unknown[]) => Promise<string>;
  generateExpertReport: (...args: unknown[]) => Promise<ExpertReport>;
  buildFallbackExpertReport: (
    inputValue: LangchainAuditInput,
    reason: string,
  ) => ExpertReport;
  buildSectionPayloads: (inputValue: LangchainAuditInput) => {
    executiveSection: Record<string, unknown>;
    prioritySection: Record<string, unknown>;
    executionSection: Record<string, unknown>;
    clientCommsSection: Record<string, unknown>;
  };
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
    payloads: {
      executiveSection: Record<string, unknown>;
      prioritySection: Record<string, unknown>;
      executionSection: Record<string, unknown>;
      clientCommsSection: Record<string, unknown>;
    },
    locale: 'fr' | 'en',
    inputValue: LangchainAuditInput,
    budget: DeadlineBudget,
    options?: unknown,
  ) => Promise<Record<string, unknown>>;
}

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

  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    fetchTimeoutMs: 8_000,
    llmProfile: 'stability_first_sequential',
    rateHourlyMin: 90,
    rateHourlyMax: 130,
    openAiApiKey: undefined,
  });

  const input: LangchainAuditInput = buildLangchainAuditInput();

  /** Cast de commodite pour acceder aux methodes privees en contexte de test. */
  function asTestable(
    service: LangchainAuditReportService,
  ): LangchainServiceTestable {
    return service as unknown as LangchainServiceTestable;
  }

  it('returns deterministic fallback with cost estimate when api key is missing', async () => {
    const service = createService(config, new ReportQualityGateService());
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

  it('projects an ExpertReportSynthesis with the 3 new fields in fallback mode', async () => {
    const service = createService(config, new ReportQualityGateService());
    const result = await service.generate(input);

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
    const service = createService(config, new ReportQualityGateService());
    const result = await service.generate(input);
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
      }))
      .mockImplementationOnce((summaryText, report) => ({
        summaryText,
        report,
        valid: true,
        reasons: [],
      }));

    /** Mock partiel : seule la methode apply est utilisee dans ce chemin de test. */
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
