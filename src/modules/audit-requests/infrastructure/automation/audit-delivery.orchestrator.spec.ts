/* eslint-disable @typescript-eslint/unbound-method */
import type { AuditSnapshot } from '../../domain/AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from '../../domain/AuditReportTiers';
import type { EngineCoverage, EngineScore } from '../../domain/EngineCoverage';
import type { IAuditNotifierPort } from '../../domain/IAuditNotifier.port';
import type { IAuditPdfGenerator } from '../../domain/IAuditPdfGenerator';
import type { IAuditRequestsRepository } from '../../domain/IAuditRequests.repository';
import {
  buildAuditSnapshot,
  createMockAuditNotifier,
  createMockAuditRequestsRepo,
} from '../../../../../test/factories/audit-requests.factory';
import { AuditDeliveryOrchestrator } from './audit-delivery.orchestrator';
import type { LangchainClientReportService } from './langchain-client-report.service';
import type { PageAiRecap } from './page-ai-recap.service';

function buildEngineScore(
  engine: EngineScore['engine'],
  score: number,
): EngineScore {
  return {
    engine,
    score,
    indexable: true,
    strengths: [`${engine}-strength`],
    blockers: [],
    opportunities: [`${engine}-opportunity`],
  };
}

function buildPageRecap(overrides: Partial<PageAiRecap> = {}): PageAiRecap {
  return {
    url: 'https://example.com/',
    finalUrl: 'https://example.com/',
    priority: 'medium',
    language: 'fr',
    wordingScore: 70,
    trustScore: 70,
    ctaScore: 70,
    seoCopyScore: 70,
    summary: 'Recap',
    topIssues: ['Meta'],
    recommendations: ['Improve meta'],
    source: 'fallback',
    engineScores: {
      google: buildEngineScore('google', 70),
      bingChatGpt: buildEngineScore('bing_chatgpt', 60),
      perplexity: buildEngineScore('perplexity', 50),
      geminiOverviews: buildEngineScore('gemini_overviews', 55),
    },
    ...overrides,
  } as PageAiRecap;
}

function buildClientReport(): ClientReportSynthesis {
  return {
    executiveSummary: 'Resume',
    topFindings: [{ title: 'Finding', impact: 'Impact', severity: 'high' }],
    googleVsAiMatrix: {
      googleVisibility: { score: 80, summary: 'OK' },
      aiVisibility: { score: 40, summary: 'A ameliorer' },
    },
    pillarScorecard: [],
    quickWins: [],
    cta: { title: 'CTA', description: 'Desc', actionLabel: 'Action' },
  };
}

function buildExpertReport(): ExpertReportSynthesis {
  return {
    executiveSummary: 'Expert summary',
    perPageAnalysis: [],
    crossPageFindings: [],
    priorityBacklog: [],
    clientEmailDraft: { subject: 'Subject', body: 'Body' },
    internalNotes: 'Notes',
  };
}

describe('AuditDeliveryOrchestrator', () => {
  let repo: jest.Mocked<IAuditRequestsRepository>;
  let notifier: jest.Mocked<IAuditNotifierPort>;
  let pdfGenerator: jest.Mocked<IAuditPdfGenerator>;
  let clientReportService: jest.Mocked<
    Pick<LangchainClientReportService, 'generate'>
  >;
  let orchestrator: AuditDeliveryOrchestrator;

  const baseSnapshot: AuditSnapshot = buildAuditSnapshot({
    processingStatus: 'COMPLETED',
    progress: 100,
    done: true,
  });

  beforeEach(() => {
    repo = createMockAuditRequestsRepo();
    notifier = createMockAuditNotifier();
    pdfGenerator = {
      generate: jest.fn().mockResolvedValue(Buffer.from('%PDF fake')),
    };
    clientReportService = {
      generate: jest.fn().mockResolvedValue(buildClientReport()),
    };
    orchestrator = new AuditDeliveryOrchestrator(
      repo,
      notifier,
      pdfGenerator as unknown as IAuditPdfGenerator,
      clientReportService as unknown as LangchainClientReportService,
    );
  });

  describe('runForAudit', () => {
    it('declenche la chaine delivery complete (client EMAIL)', async () => {
      repo.findById.mockResolvedValue(baseSnapshot);

      await orchestrator.runForAudit({
        auditId: baseSnapshot.id,
        locale: 'fr',
        websiteName: 'example.com',
        contactMethod: 'EMAIL',
        contactValue: 'client@example.com',
        normalizedUrl: 'https://example.com/',
        pillarScores: { seo: 70 },
        quickWins: ['win-1'],
        pageRecaps: [buildPageRecap()],
        expertReport: buildExpertReport(),
        deepFindings: [
          {
            code: 'x',
            title: 'Meta trop courtes',
            description: 'Description',
            severity: 'medium',
            confidence: 0.8,
            impact: 'traffic',
            affectedUrls: [],
            recommendation: 'Fix meta',
          },
        ],
      });

      expect(clientReportService.generate).toHaveBeenCalledTimes(1);
      expect(pdfGenerator.generate).toHaveBeenCalledTimes(1);
      const pdfArgs = pdfGenerator.generate.mock.calls[0];
      // 2 rapports (client + expert) passes au PDF
      expect(pdfArgs[1]).toEqual(
        expect.objectContaining({ executiveSummary: 'Resume' }),
      );
      expect(pdfArgs[2]).toEqual(
        expect.objectContaining({ executiveSummary: 'Expert summary' }),
      );

      expect(repo.updateState).toHaveBeenCalledTimes(1);
      const stateArgs = repo.updateState.mock.calls[0];
      expect(stateArgs[0]).toBe(baseSnapshot.id);
      expect(stateArgs[1]).toEqual(
        expect.objectContaining({
          clientReport: expect.any(Object),
          expertReport: expect.any(Object),
          engineCoverage: expect.any(Object),
        }),
      );

      // Attendre la micro-tache pour que les mails fire-and-forget se resolvent
      await new Promise((resolve) => setImmediate(resolve));

      expect(notifier.sendClientReport).toHaveBeenCalledTimes(1);
      expect(notifier.sendExpertReport).toHaveBeenCalledTimes(1);
      const clientCall = notifier.sendClientReport.mock.calls[0][0];
      expect(clientCall.to).toBe('client@example.com');
      expect(clientCall.pdfBuffer).toBeInstanceOf(Buffer);
      // P0.6 : le prenom est deduit du local-part de l'email.
      expect(clientCall.firstName).toBe('Client');
    });

    describe('P0.6 — extraction firstName depuis email', () => {
      it('deduit le prenom depuis tim.moyence@outlook.fr', async () => {
        repo.findById.mockResolvedValue(baseSnapshot);

        await orchestrator.runForAudit({
          auditId: baseSnapshot.id,
          locale: 'fr',
          websiteName: 'example.com',
          contactMethod: 'EMAIL',
          contactValue: 'tim.moyence@outlook.fr',
          normalizedUrl: 'https://example.com/',
          pillarScores: {},
          quickWins: [],
          pageRecaps: [buildPageRecap()],
          expertReport: buildExpertReport(),
          deepFindings: [],
        });
        await new Promise((resolve) => setImmediate(resolve));

        const clientCall = notifier.sendClientReport.mock.calls[0][0];
        expect(clientCall.firstName).toBe('Tim');
      });

      it('retourne null pour les emails non exploitables (prenoms numeriques)', async () => {
        repo.findById.mockResolvedValue(baseSnapshot);

        await orchestrator.runForAudit({
          auditId: baseSnapshot.id,
          locale: 'fr',
          websiteName: 'example.com',
          contactMethod: 'EMAIL',
          contactValue: '12345@example.com',
          normalizedUrl: 'https://example.com/',
          pillarScores: {},
          quickWins: [],
          pageRecaps: [buildPageRecap()],
          expertReport: buildExpertReport(),
          deepFindings: [],
        });
        await new Promise((resolve) => setImmediate(resolve));

        const clientCall = notifier.sendClientReport.mock.calls[0][0];
        expect(clientCall.firstName).toBeNull();
      });
    });

    it('skip sendClientReport quand le contact est PHONE', async () => {
      repo.findById.mockResolvedValue(baseSnapshot);

      await orchestrator.runForAudit({
        auditId: baseSnapshot.id,
        locale: 'fr',
        websiteName: 'example.com',
        contactMethod: 'PHONE',
        contactValue: '+33612345678',
        normalizedUrl: 'https://example.com/',
        pillarScores: {},
        quickWins: [],
        pageRecaps: [buildPageRecap()],
        expertReport: buildExpertReport(),
        deepFindings: [],
      });

      await new Promise((resolve) => setImmediate(resolve));

      expect(notifier.sendClientReport).not.toHaveBeenCalled();
      expect(notifier.sendExpertReport).toHaveBeenCalledTimes(1);
      const expertCall = notifier.sendExpertReport.mock.calls[0][0];
      expect(expertCall.clientContact.method).toBe('PHONE');
      expect(expertCall.clientContact.value).toBe('+33612345678');
    });

    it('marque pdfBuffer=null si la generation PDF echoue (audit reste livre)', async () => {
      repo.findById.mockResolvedValue(baseSnapshot);
      pdfGenerator.generate.mockRejectedValueOnce(new Error('PDF crash'));

      await orchestrator.runForAudit({
        auditId: baseSnapshot.id,
        locale: 'fr',
        websiteName: 'example.com',
        contactMethod: 'EMAIL',
        contactValue: 'client@example.com',
        normalizedUrl: 'https://example.com/',
        pillarScores: {},
        quickWins: [],
        pageRecaps: [buildPageRecap()],
        expertReport: buildExpertReport(),
        deepFindings: [],
      });

      await new Promise((resolve) => setImmediate(resolve));

      // Le state est persiste meme sans PDF
      expect(repo.updateState).toHaveBeenCalledTimes(1);
      // Client mail envoye avec pdfBuffer null
      expect(notifier.sendClientReport).toHaveBeenCalledTimes(1);
      const clientCall = notifier.sendClientReport.mock.calls[0][0];
      expect(clientCall.pdfBuffer).toBeNull();
      // Expert mail envoye quand meme
      expect(notifier.sendExpertReport).toHaveBeenCalledTimes(1);
    });

    it('est idempotent : skip delivery si clientReport deja persiste', async () => {
      const alreadyDelivered = buildAuditSnapshot({
        clientReport: buildClientReport(),
      });
      repo.findById.mockResolvedValue(alreadyDelivered);

      await orchestrator.runForAudit({
        auditId: alreadyDelivered.id,
        locale: 'fr',
        websiteName: 'example.com',
        contactMethod: 'EMAIL',
        contactValue: 'client@example.com',
        normalizedUrl: 'https://example.com/',
        pillarScores: {},
        quickWins: [],
        pageRecaps: [buildPageRecap()],
        expertReport: buildExpertReport(),
        deepFindings: [],
      });

      expect(clientReportService.generate).not.toHaveBeenCalled();
      expect(pdfGenerator.generate).not.toHaveBeenCalled();
      expect(repo.updateState).not.toHaveBeenCalled();
      expect(notifier.sendClientReport).not.toHaveBeenCalled();
      expect(notifier.sendExpertReport).not.toHaveBeenCalled();
    });

    it('attrape les exceptions de clientReportService.generate', async () => {
      repo.findById.mockResolvedValue(baseSnapshot);
      clientReportService.generate.mockRejectedValueOnce(
        new Error('LLM crash unexpected'),
      );

      // Ne doit pas throw — l'orchestrateur attrape l'erreur et log
      await expect(
        orchestrator.runForAudit({
          auditId: baseSnapshot.id,
          locale: 'fr',
          websiteName: 'example.com',
          contactMethod: 'EMAIL',
          contactValue: 'client@example.com',
          normalizedUrl: 'https://example.com/',
          pillarScores: {},
          quickWins: [],
          pageRecaps: [buildPageRecap()],
          expertReport: buildExpertReport(),
          deepFindings: [],
        }),
      ).resolves.toBeUndefined();

      expect(pdfGenerator.generate).not.toHaveBeenCalled();
      expect(notifier.sendClientReport).not.toHaveBeenCalled();
    });

    it('skip delivery si expertSynthesis est manquant', async () => {
      repo.findById.mockResolvedValue(baseSnapshot);

      await orchestrator.runForAudit({
        auditId: baseSnapshot.id,
        locale: 'fr',
        websiteName: 'example.com',
        contactMethod: 'EMAIL',
        contactValue: 'client@example.com',
        normalizedUrl: 'https://example.com/',
        pillarScores: {},
        quickWins: [],
        pageRecaps: [buildPageRecap()],
        expertReport: undefined,
        deepFindings: [],
      });

      expect(repo.findById).not.toHaveBeenCalled();
      expect(clientReportService.generate).not.toHaveBeenCalled();
    });
  });

  describe('deliver (aggregateEngineCoverage)', () => {
    it('calcule la moyenne des scores par moteur', async () => {
      repo.findById.mockResolvedValue(baseSnapshot);

      await orchestrator.runForAudit({
        auditId: baseSnapshot.id,
        locale: 'fr',
        websiteName: 'example.com',
        contactMethod: 'EMAIL',
        contactValue: 'client@example.com',
        normalizedUrl: 'https://example.com/',
        pillarScores: {},
        quickWins: [],
        pageRecaps: [
          buildPageRecap({
            engineScores: {
              google: buildEngineScore('google', 80),
              bingChatGpt: buildEngineScore('bing_chatgpt', 60),
              perplexity: buildEngineScore('perplexity', 40),
              geminiOverviews: buildEngineScore('gemini_overviews', 50),
            },
          }),
          buildPageRecap({
            engineScores: {
              google: buildEngineScore('google', 60),
              bingChatGpt: buildEngineScore('bing_chatgpt', 40),
              perplexity: buildEngineScore('perplexity', 60),
              geminiOverviews: buildEngineScore('gemini_overviews', 30),
            },
          }),
        ],
        expertReport: buildExpertReport(),
        deepFindings: [],
      });

      const state = repo.updateState.mock.calls[0][1];
      const coverage = state.engineCoverage as EngineCoverage;
      expect(coverage.google.score).toBe(70);
      expect(coverage.bingChatGpt.score).toBe(50);
      expect(coverage.perplexity.score).toBe(50);
      expect(coverage.geminiOverviews.score).toBe(40);
    });
  });
});
