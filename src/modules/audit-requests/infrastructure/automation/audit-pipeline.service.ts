import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AuditLocale,
  localeFromUrlPath,
  resolveAuditLocale,
} from '../../domain/audit-locale.util';
import type { IAuditRequestsRepository } from '../../domain/IAuditRequests.repository';
import {
  AUDIT_AUTOMATION_CONFIG,
  AUDIT_REQUESTS_REPOSITORY,
} from '../../domain/token';
import { AuditRequestMailerService } from '../AuditRequestMailer.service';
import type { AuditAutomationConfig } from './audit.config';
import { AuditDeliveryOrchestrator } from './audit-delivery.orchestrator';
import {
  DeepUrlAnalysisResult,
  DeepUrlAnalysisService,
  TechFingerprint,
} from './deep-url-analysis.service';
import { HomepageAnalyzerService } from './homepage-analyzer.service';
import {
  LangchainAuditReportService,
  LangchainAuditOutput,
  LlmSynthesisProgressEvent,
} from './langchain-audit-report.service';
import { LlmsTxtAnalyzerService } from './llms-txt-analyzer.service';
import {
  PageAiRecap,
  PageAiRecapService,
  PageAiRecapSummary,
} from './page-ai-recap.service';
import type { LlmsTxtAnalysis } from '../../domain/AiIndexability';
import { ScoringService } from './scoring.service';
import { SafeFetchService } from './safe-fetch.service';
import { SitemapDiscoveryService } from './sitemap-discovery.service';
import { normalizeAuditUrl } from './url-normalizer.util';
import {
  UrlIndexabilityResult,
  UrlIndexabilityService,
} from './url-indexability.service';

@Injectable()
export class AuditPipelineService {
  private readonly logger = new Logger(AuditPipelineService.name);

  constructor(
    @Inject(AUDIT_REQUESTS_REPOSITORY)
    private readonly repo: IAuditRequestsRepository,
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly safeFetch: SafeFetchService,
    private readonly homepageAnalyzer: HomepageAnalyzerService,
    private readonly deepUrlAnalysis: DeepUrlAnalysisService,
    private readonly sitemapDiscovery: SitemapDiscoveryService,
    private readonly urlIndexability: UrlIndexabilityService,
    private readonly pageAiRecap: PageAiRecapService,
    private readonly scoring: ScoringService,
    private readonly llmReport: LangchainAuditReportService,
    private readonly mailer: AuditRequestMailerService,
    private readonly llmsTxtAnalyzer: LlmsTxtAnalyzerService,
    private readonly deliveryOrchestrator: AuditDeliveryOrchestrator,
  ) {}

  async run(auditId: string): Promise<void> {
    const audit = await this.repo.findById(auditId);
    if (!audit) {
      this.logger.warn(`Audit ${auditId} not found in pipeline.`);
      return;
    }

    try {
      const locale = resolveAuditLocale(audit.locale);
      const t = this.copy(locale);

      await this.repo.updateState(auditId, {
        processingStatus: 'RUNNING',
        progress: 10,
        step: t.steps.normalizeUrl,
        error: null,
        startedAt: new Date(),
      });

      const normalized = await normalizeAuditUrl(audit.websiteName);
      await this.repo.updateState(auditId, {
        normalizedUrl: normalized.normalizedUrl,
        step: t.steps.homepageAnalysis,
      });

      const homepageResponse = await this.safeFetch.fetchText(
        normalized.normalizedUrl,
        this.config.htmlMaxBytes,
      );
      const homepage = this.homepageAnalyzer.analyze(homepageResponse);
      const fastScoring = this.scoring.compute(homepage, [], [], locale);
      const technicalKeyChecks = {
        ...fastScoring.keyChecks,
        firstRender: {
          ready: false,
          strategy: 'final_only',
        },
      };

      const homepageOrigin = this.safeOrigin(homepage.finalUrl);
      const llmsTxtAnalysis = await this.runLlmsTxtAnalysis(homepageOrigin);
      const robotsTxt = await this.fetchRobotsTxt(homepageOrigin);
      const technicalKeyChecksWithAi = {
        ...technicalKeyChecks,
        llmsTxt: llmsTxtAnalysis,
      };

      await this.repo.updateState(auditId, {
        progress: 20,
        step: t.steps.homepageBaselineReady,
        finalUrl: homepage.finalUrl,
        redirectChain: homepage.redirectChain,
        quickWins: fastScoring.quickWins.slice(0, 3),
        pillarScores: fastScoring.pillarScores,
        keyChecks: technicalKeyChecksWithAi,
      });

      await this.repo.updateState(auditId, {
        step: t.steps.sitemapAnalysis,
      });

      const sitemapResult = await this.sitemapDiscovery.discover(
        homepage.finalUrl,
      );
      const candidateUrls = Array.from(
        new Set([
          homepage.finalUrl,
          ...sitemapResult.urls,
          ...homepage.internalLinks,
        ]),
      );

      const selectedUrls = this.selectUrlsForLocale(
        candidateUrls,
        homepage.finalUrl,
        locale,
        this.config.pageAnalyzeLimit,
      );

      const pageSnapshots = await this.analyzeTechnicalPagesPhase({
        auditId,
        urls: selectedUrls,
        baseKeyChecks: technicalKeyChecksWithAi,
        stepForProgress: t.steps.pagesTechnical,
        robotsTxt,
      });

      const deepUrlAnalysis = this.deepUrlAnalysis.analyze(
        pageSnapshots,
        locale,
      );
      const techFingerprint = this.deepUrlAnalysis.inferTechFingerprint(
        homepage,
        pageSnapshots,
        locale,
      );
      const scoring = this.scoring.compute(
        homepage,
        sitemapResult.sitemapUrls,
        pageSnapshots,
        locale,
        { llmsTxt: llmsTxtAnalysis },
      );

      await this.repo.updateState(auditId, {
        progress: 60,
        step: t.steps.pageAiAnalysis(0, pageSnapshots.length),
      });

      const analysisKeyChecksBase = {
        ...scoring.keyChecks,
        deepUrlAnalysis: deepUrlAnalysis.metrics,
        techFingerprint,
        llmsTxt: llmsTxtAnalysis,
      };
      const pageAi = await this.analyzePageAiPhase({
        auditId,
        locale,
        websiteName: audit.websiteName,
        normalizedUrl: normalized.normalizedUrl,
        pages: pageSnapshots,
        baseKeyChecks: analysisKeyChecksBase,
        stepForProgress: t.steps.pageAiAnalysis,
      });

      const fullQuickWins = this.mergeQuickWins(
        [
          ...scoring.quickWins,
          ...deepUrlAnalysis.findings.map((finding) => finding.recommendation),
          ...pageAi.recaps.flatMap((recap) => recap.recommendations),
        ],
        12,
      );
      const crawlCoverage = {
        sitemapUrls: sitemapResult.urls.length,
        internalLinks: homepage.internalLinks.length,
        candidateUrls: candidateUrls.length,
        selectedUrls: selectedUrls.length,
        analyzedUrls: pageSnapshots.length,
      };
      const synthesisProgressKeyChecksBase = {
        ...analysisKeyChecksBase,
        crawlCoverage,
      };
      const llmKeyChecks = {
        ...analysisKeyChecksBase,
        pageAiSummary: pageAi.summary,
      };

      await this.repo.updateState(auditId, {
        progress: 85,
        step: t.steps.summaryGeneration,
        keyChecks: {
          ...synthesisProgressKeyChecksBase,
          progressDetails: {
            phase: 'synthesis',
            iaTask: 'synthesis',
            iaSubTask: 'summary',
            done: 0,
            total: 5,
          },
        },
        quickWins: fullQuickWins,
        pillarScores: scoring.pillarScores,
      });

      const llmOutput = await this.generateSynthesisPhase({
        auditId,
        locale,
        websiteName: audit.websiteName,
        normalizedUrl: normalized.normalizedUrl,
        quickWins: fullQuickWins,
        pillarScores: scoring.pillarScores,
        deepFindings: deepUrlAnalysis.findings,
        pageSnapshots,
        pageRecaps: pageAi.recaps,
        pageSummary: pageAi.summary,
        techFingerprint,
        llmKeyChecks,
        progressKeyChecksBase: synthesisProgressKeyChecksBase,
        progressStep: t.steps.summaryGeneration,
      });

      await this.repo.updateState(auditId, {
        progress: 95,
        step: t.steps.finalReportPreparation,
      });

      const localeCoverage = this.buildLocaleCoverage(locale, pageSnapshots);
      const fullReport = this.buildFullReport({
        locale,
        llmOutput,
        homepage,
        sitemapResult,
        candidateUrls,
        selectedUrls,
        pageSnapshots,
        deepUrlAnalysis,
        scoring,
        pageRecaps: pageAi.recaps,
        pageRecapSummary: pageAi.summary,
        pageWarnings: pageAi.warnings,
        localeCoverage,
        techFingerprint,
      });

      await this.repo.updateState(auditId, {
        processingStatus: 'COMPLETED',
        progress: 100,
        step: t.steps.completed,
        done: true,
        summaryText: llmOutput.summaryText,
        fullReport,
        finishedAt: new Date(),
      });

      // Note: l'ancien envoi `sendAuditReportNotification` (dump JSON admin legacy)
      // a ete retire en Loop #2 pour eviter un double email admin. Le chemin
      // officiel passe desormais par `deliveryOrchestrator.runForAudit` qui orchestre
      // la generation et l'envoi des rapports (notification, client, expert).
      await this.deliveryOrchestrator.runForAudit({
        auditId,
        locale,
        websiteName: audit.websiteName,
        contactMethod: audit.contactMethod,
        contactValue: audit.contactValue,
        normalizedUrl: normalized.normalizedUrl,
        pillarScores: scoring.pillarScores,
        quickWins: fullQuickWins,
        pageRecaps: pageAi.recaps,
        expertReport: llmOutput.expertSynthesis,
        deepFindings: deepUrlAnalysis.findings,
      });
    } catch (error) {
      await this.repo.updateState(auditId, {
        processingStatus: 'FAILED',
        progress: 100,
        step:
          resolveAuditLocale(audit.locale) === 'en'
            ? 'Audit failed'
            : 'Audit en echec',
        done: false,
        error: this.toSafeError(error),
        finishedAt: new Date(),
      });
    }
  }

  private async analyzeTechnicalPagesPhase(input: {
    auditId: string;
    urls: string[];
    baseKeyChecks: Record<string, unknown>;
    stepForProgress: (done: number, total: number) => string;
    robotsTxt: string;
  }): Promise<UrlIndexabilityResult[]> {
    let writeQueue = Promise.resolve();
    let lastDone = 0;
    const recentCompletedUrls: string[] = [];
    const enqueueUpdate = (
      done: number,
      total: number,
      currentUrl: string,
    ): Promise<void> => {
      writeQueue = writeQueue.then(async () => {
        if (done <= lastDone) return;
        lastDone = done;
        this.pushRecentUrl(recentCompletedUrls, currentUrl, 5);
        await this.repo.updateState(input.auditId, {
          progress: this.interpolateProgress(done, total, 20, 60),
          step: input.stepForProgress(done, total),
          keyChecks: {
            ...input.baseKeyChecks,
            progressDetails: {
              phase: 'technical_pages',
              iaTask: 'technical_scan',
              iaSubTask: 'headers_indexability_signals',
              done,
              total,
              currentUrl,
              recentCompletedUrls: [...recentCompletedUrls],
            },
          },
        });
      });
      return writeQueue;
    };

    const pageSnapshots = await this.urlIndexability.analyzeUrls(input.urls, {
      robotsTxt: input.robotsTxt,
      onUrlAnalyzed: async (result, done, total) =>
        enqueueUpdate(done, total, result.url),
    });
    await writeQueue;
    return pageSnapshots;
  }

  /**
   * Analyse le fichier `llms.txt` au niveau site. Ne lève jamais — un échec
   * retourne un résultat "absent" typé pour ne pas casser le pipeline.
   */
  private async runLlmsTxtAnalysis(
    origin: string | null,
  ): Promise<LlmsTxtAnalysis> {
    if (!origin) {
      return {
        present: false,
        url: '',
        sizeBytes: 0,
        sections: [],
        hasFullVariant: false,
        complianceScore: 0,
        issues: ['Origine invalide'],
      };
    }
    try {
      return await this.llmsTxtAnalyzer.analyze(origin);
    } catch (error) {
      this.logger.warn(
        `llms.txt analysis failed for ${origin}: ${String(error)}`,
      );
      return {
        present: false,
        url: `${origin}/llms.txt`,
        sizeBytes: 0,
        sections: [],
        hasFullVariant: false,
        complianceScore: 0,
        issues: ['Analyse llms.txt échouée'],
      };
    }
  }

  /**
   * Récupère `robots.txt` une seule fois au niveau site pour le passer au
   * `AiHeadersAnalyzerService` via `UrlIndexabilityService.analyzeUrls`.
   * En cas d'erreur réseau ou de 404, retourne une chaîne vide.
   */
  private async fetchRobotsTxt(origin: string | null): Promise<string> {
    if (!origin) return '';
    const url = `${origin}/robots.txt`;
    try {
      const response = await this.safeFetch.fetchText(url);
      if (response.statusCode < 400 && response.body) {
        return response.body;
      }
      return '';
    } catch (error) {
      this.logger.warn(`robots.txt fetch failed for ${url}: ${String(error)}`);
      return '';
    }
  }

  private safeOrigin(url: string): string | null {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }

  private async analyzePageAiPhase(input: {
    auditId: string;
    locale: AuditLocale;
    websiteName: string;
    normalizedUrl: string;
    pages: UrlIndexabilityResult[];
    baseKeyChecks: Record<string, unknown>;
    stepForProgress: (done: number, total: number) => string;
  }): Promise<{
    recaps: PageAiRecap[];
    summary: PageAiRecapSummary;
    warnings: string[];
  }> {
    let writeQueue = Promise.resolve();
    let lastDone = 0;
    const recentCompletedUrls: string[] = [];
    const enqueueUpdate = (
      done: number,
      total: number,
      recap: PageAiRecap,
    ): Promise<void> => {
      writeQueue = writeQueue.then(async () => {
        if (done <= lastDone) return;
        lastDone = done;
        this.pushRecentUrl(recentCompletedUrls, recap.url, 5);
        await this.repo.updateState(input.auditId, {
          progress: this.interpolateProgress(done, total, 60, 85),
          step: input.stepForProgress(done, total),
          keyChecks: {
            ...input.baseKeyChecks,
            progressDetails: {
              phase: 'page_ai_recaps',
              iaTask: 'page_ai_recap',
              iaSubTask: 'conversion_seo_micro_audit',
              done,
              total,
              currentUrl: recap.url,
              recentCompletedUrls: [...recentCompletedUrls],
            },
          },
        });
      });
      return writeQueue;
    };

    const pageAi = await this.pageAiRecap.analyzePages(
      {
        locale: input.locale,
        websiteName: input.websiteName,
        normalizedUrl: input.normalizedUrl,
        pages: input.pages,
      },
      {
        onRecapReady: async (recap, done, total) =>
          enqueueUpdate(done, total, recap),
      },
    );
    await writeQueue;
    return pageAi;
  }

  private async generateSynthesisPhase(input: {
    auditId: string;
    locale: AuditLocale;
    websiteName: string;
    normalizedUrl: string;
    quickWins: string[];
    pillarScores: Record<string, number>;
    deepFindings: DeepUrlAnalysisResult['findings'];
    pageSnapshots: UrlIndexabilityResult[];
    pageRecaps: PageAiRecap[];
    pageSummary: PageAiRecapSummary;
    techFingerprint: TechFingerprint;
    llmKeyChecks: Record<string, unknown>;
    progressKeyChecksBase: Record<string, unknown>;
    progressStep: string;
  }): Promise<LangchainAuditOutput> {
    const synthesisSections = [
      'summary',
      'executiveSection',
      'prioritySection',
      'executionSection',
      'clientCommsSection',
    ] as const;
    const synthesisStatus = new Map<string, string>();
    let writeQueue = Promise.resolve();
    const enqueueUpdate = (
      progressEvent: LlmSynthesisProgressEvent,
    ): Promise<void> => {
      writeQueue = writeQueue.then(async () => {
        if (progressEvent.section && progressEvent.sectionStatus) {
          synthesisStatus.set(
            progressEvent.section,
            progressEvent.sectionStatus,
          );
        }
        const done = synthesisSections.filter((section) => {
          const status = synthesisStatus.get(section);
          return (
            status === 'completed' ||
            status === 'failed' ||
            status === 'fallback'
          );
        }).length;
        await this.repo.updateState(input.auditId, {
          progress: this.interpolateProgress(
            done,
            synthesisSections.length,
            85,
            95,
          ),
          step: input.progressStep,
          keyChecks: {
            ...input.progressKeyChecksBase,
            progressDetails: {
              phase: 'synthesis',
              iaTask: 'synthesis',
              iaSubTask: progressEvent.iaSubTask,
              done,
              total: synthesisSections.length,
              section: progressEvent.section,
              sectionStatus: progressEvent.sectionStatus,
              sectionStatuses: Object.fromEntries(synthesisStatus.entries()),
            },
          },
        });
      });
      return writeQueue;
    };

    const llmOutput = await this.llmReport.generate(
      {
        auditId: input.auditId,
        locale: input.locale,
        websiteName: input.websiteName,
        normalizedUrl: input.normalizedUrl,
        keyChecks: input.llmKeyChecks,
        quickWins: input.quickWins,
        pillarScores: input.pillarScores,
        deepFindings: input.deepFindings,
        sampledUrls: input.pageSnapshots.map((entry) => ({
          url: entry.url,
          statusCode: entry.statusCode,
          indexable: entry.indexable,
          canonical: entry.canonical,
          title: entry.title,
          metaDescription: entry.metaDescription,
          h1Count: entry.h1Count,
          htmlLang: entry.htmlLang,
          canonicalCount: entry.canonicalCount,
          responseTimeMs: entry.responseTimeMs,
          server: entry.server,
          xPoweredBy: entry.xPoweredBy,
          setCookiePatterns: entry.setCookiePatterns ?? [],
          cacheHeaders: entry.cacheHeaders ?? {},
          securityHeaders: entry.securityHeaders ?? {},
          error: entry.error,
        })),
        pageRecaps: input.pageRecaps.map((recap) => ({
          url: recap.url,
          priority: recap.priority,
          wordingScore: recap.wordingScore,
          trustScore: recap.trustScore,
          ctaScore: recap.ctaScore,
          seoCopyScore: recap.seoCopyScore,
          topIssues: recap.topIssues,
          recommendations: recap.recommendations,
          source: recap.source,
        })),
        pageSummary: input.pageSummary as unknown as Record<string, unknown>,
        techFingerprint: input.techFingerprint,
      },
      {
        onProgress: (event) => enqueueUpdate(event),
      },
    );

    await writeQueue;
    return llmOutput;
  }

  private selectUrlsForLocale(
    candidateUrls: string[],
    homepageUrl: string,
    locale: AuditLocale,
    limit: number,
  ): string[] {
    const origin = new URL(homepageUrl).origin;
    const localized: string[] = [];
    const neutral: string[] = [];
    const alternate: string[] = [];
    const seen = new Set<string>();
    const targetLocale = locale;
    const altLocale: AuditLocale = locale === 'fr' ? 'en' : 'fr';

    const pushUnique = (bucket: string[], url: string): void => {
      if (seen.has(url)) return;
      seen.add(url);
      bucket.push(url);
    };

    const normalizedHomepage = this.normalizeCandidateUrl(homepageUrl, origin);
    if (normalizedHomepage) {
      pushUnique(localized, normalizedHomepage);
    }

    for (const raw of candidateUrls) {
      const normalized = this.normalizeCandidateUrl(raw, origin);
      if (!normalized) continue;
      const urlLocale = localeFromUrlPath(new URL(normalized).pathname);

      if (urlLocale === targetLocale) {
        pushUnique(localized, normalized);
      } else if (urlLocale === altLocale) {
        pushUnique(alternate, normalized);
      } else {
        pushUnique(neutral, normalized);
      }
    }

    return [...localized, ...neutral, ...alternate].slice(
      0,
      Math.max(1, limit),
    );
  }

  private normalizeCandidateUrl(value: string, origin: string): string | null {
    try {
      const url = new URL(value, origin);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (url.origin !== origin) return null;
      url.hash = '';
      return url.toString();
    } catch {
      return null;
    }
  }

  private mergeQuickWins(values: string[], limit: number): string[] {
    return Array.from(
      new Set(values.map((entry) => entry.trim()).filter(Boolean)),
    ).slice(0, limit);
  }

  private buildLocaleCoverage(
    locale: AuditLocale,
    pages: UrlIndexabilityResult[],
  ): Record<string, unknown> {
    const expected = locale;
    let matchingLang = 0;
    let mismatchedLang = 0;
    let unknownLang = 0;
    let localizedPath = 0;
    let neutralPath = 0;
    let alternatePath = 0;

    for (const page of pages) {
      const pageLocale = localeFromUrlPath(new URL(page.url).pathname);
      if (pageLocale === expected) localizedPath += 1;
      else if (pageLocale === null) neutralPath += 1;
      else alternatePath += 1;

      const htmlLang = (page.htmlLang ?? '').toLowerCase();
      if (htmlLang.startsWith(expected)) {
        matchingLang += 1;
      } else if (htmlLang.startsWith('fr') || htmlLang.startsWith('en')) {
        mismatchedLang += 1;
      } else {
        unknownLang += 1;
      }
    }

    return {
      expectedLocale: expected,
      matchingLang,
      mismatchedLang,
      unknownLang,
      localizedPath,
      neutralPath,
      alternatePath,
      totalAnalyzedPages: pages.length,
    };
  }

  private buildFullReport(input: {
    locale: AuditLocale;
    llmOutput: LangchainAuditOutput;
    homepage: ReturnType<HomepageAnalyzerService['analyze']>;
    sitemapResult: { sitemapUrls: string[]; urls: string[] };
    candidateUrls: string[];
    selectedUrls: string[];
    pageSnapshots: UrlIndexabilityResult[];
    deepUrlAnalysis: DeepUrlAnalysisResult;
    scoring: ReturnType<ScoringService['compute']>;
    pageRecaps: PageAiRecap[];
    pageRecapSummary: PageAiRecapSummary;
    pageWarnings: string[];
    localeCoverage: Record<string, unknown>;
    techFingerprint: TechFingerprint;
  }): Record<string, unknown> {
    return {
      generatedAt: new Date().toISOString(),
      locale: input.locale,
      homepage: input.homepage,
      sitemap: {
        sitemapUrls: input.sitemapResult.sitemapUrls,
        totalUrlsDiscovered: input.sitemapResult.urls.length,
        candidateUrls: input.candidateUrls.length,
        selectedUrls: input.selectedUrls.length,
        sampledUrls: input.pageSnapshots,
      },
      pages: {
        snapshots: input.pageSnapshots,
        aiRecaps: input.pageRecaps,
        summary: input.pageRecapSummary,
        localeCoverage: input.localeCoverage,
        warnings: input.pageWarnings,
      },
      findings: input.deepUrlAnalysis.findings,
      deepMetrics: input.deepUrlAnalysis.metrics,
      scoring: {
        pillarScores: input.scoring.pillarScores,
        quickWins: input.scoring.quickWins,
        keyChecks: input.scoring.keyChecks,
        techFingerprint: input.techFingerprint,
      },
      techFingerprint: input.techFingerprint,
      llm: input.llmOutput.adminReport,
    };
  }

  private pushRecentUrl(list: string[], url: string, maxItems: number): void {
    if (!url) return;
    const existingIndex = list.indexOf(url);
    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
    }
    list.push(url);
    while (list.length > maxItems) {
      list.shift();
    }
  }

  private interpolateProgress(
    done: number,
    total: number,
    min: number,
    max: number,
  ): number {
    if (total <= 0) return min;
    const ratio = Math.max(0, Math.min(1, done / total));
    return Math.round(min + (max - min) * ratio);
  }

  private toSafeError(error: unknown): string {
    const message =
      error instanceof Error ? error.message : 'Unexpected audit error';
    return message.length > 280 ? `${message.slice(0, 280)}...` : message;
  }

  private copy(locale: AuditLocale): {
    steps: {
      normalizeUrl: string;
      homepageAnalysis: string;
      homepageBaselineReady: string;
      sitemapAnalysis: string;
      pagesTechnical: (done: number, total: number) => string;
      pageAiAnalysis: (done: number, total: number) => string;
      summaryGeneration: string;
      finalReportPreparation: string;
      completed: string;
    };
  } {
    if (locale === 'en') {
      return {
        steps: {
          normalizeUrl: 'URL normalization',
          homepageAnalysis: 'Homepage analysis',
          homepageBaselineReady: 'Homepage baseline completed',
          sitemapAnalysis: 'Sitemap discovery',
          pagesTechnical: (done: number, total: number) =>
            `Analyzing pages (${done}/${total})`,
          pageAiAnalysis: (done: number, total: number) =>
            `AI page recap (${done}/${total})`,
          summaryGeneration: 'Generating synthesis',
          finalReportPreparation: 'Preparing final report',
          completed: 'Audit completed',
        },
      };
    }

    return {
      steps: {
        normalizeUrl: 'Normalisation URL',
        homepageAnalysis: "Analyse de la page d'accueil",
        homepageBaselineReady: 'Baseline homepage terminee',
        sitemapAnalysis: 'Decouverte sitemap',
        pagesTechnical: (done: number, total: number) =>
          `Analyse des pages (${done}/${total})`,
        pageAiAnalysis: (done: number, total: number) =>
          `Recap IA des pages (${done}/${total})`,
        summaryGeneration: 'Generation de la synthese',
        finalReportPreparation: 'Preparation du rapport final',
        completed: 'Audit termine',
      },
    };
  }
}
