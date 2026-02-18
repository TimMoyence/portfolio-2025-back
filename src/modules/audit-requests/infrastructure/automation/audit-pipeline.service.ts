import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IAuditRequestsRepository } from '../../domain/IAuditRequests.repository';
import {
  AUDIT_AUTOMATION_CONFIG,
  AUDIT_REQUESTS_REPOSITORY,
} from '../../domain/token';
import { AuditRequestMailerService } from '../AuditRequestMailer.service';
import type { AuditAutomationConfig } from './audit.config';
import {
  DeepUrlAnalysisResult,
  DeepUrlAnalysisService,
} from './deep-url-analysis.service';
import { HomepageAnalyzerService } from './homepage-analyzer.service';
import {
  LangchainAuditReportService,
  LangchainAuditOutput,
} from './langchain-audit-report.service';
import { ScoringService } from './scoring.service';
import { SafeFetchService } from './safe-fetch.service';
import { SitemapDiscoveryService } from './sitemap-discovery.service';
import { pickUrlSample } from './sitemap-parser.util';
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
    private readonly scoring: ScoringService,
    private readonly llmReport: LangchainAuditReportService,
    private readonly mailer: AuditRequestMailerService,
  ) {}

  async run(auditId: string): Promise<void> {
    const audit = await this.repo.findById(auditId);
    if (!audit) {
      this.logger.warn(`Audit ${auditId} not found in pipeline.`);
      return;
    }

    try {
      await this.repo.updateState(auditId, {
        processingStatus: 'RUNNING',
        progress: 10,
        step: 'Normalisation URL',
        error: null,
        startedAt: new Date(),
      });

      const normalized = await normalizeAuditUrl(audit.websiteName);
      await this.repo.updateState(auditId, {
        normalizedUrl: normalized.normalizedUrl,
        step: 'Analyse de la page d’accueil',
      });

      const homepageResponse = await this.safeFetch.fetchText(
        normalized.normalizedUrl,
        this.config.htmlMaxBytes,
      );
      const homepage = this.homepageAnalyzer.analyze(homepageResponse);
      const fastScoring = this.scoring.compute(homepage, [], []);
      const instantQuickWins = fastScoring.quickWins.slice(0, 3);
      const instantSummaryText = this.buildInstantSummary(
        homepage,
        fastScoring.pillarScores,
        instantQuickWins,
      );

      await this.repo.updateState(auditId, {
        progress: 30,
        step: 'Diagnostic initial disponible',
        finalUrl: homepage.finalUrl,
        redirectChain: homepage.redirectChain,
        summaryText: instantSummaryText,
        quickWins: instantQuickWins,
        pillarScores: fastScoring.pillarScores,
        keyChecks: {
          ...fastScoring.keyChecks,
          firstRender: {
            ready: true,
            generatedAt: new Date().toISOString(),
          },
        },
      });

      await this.repo.updateState(auditId, {
        step: 'Analyse sitemap',
      });

      const sitemapResult = await this.sitemapDiscovery.discover(
        homepage.finalUrl,
      );
      const candidateUrls = Array.from(
        new Set([
          ...sitemapResult.urls,
          ...homepage.internalLinks,
          homepage.finalUrl,
        ]),
      );
      const { sample, deepAnalysis } = pickUrlSample(
        candidateUrls,
        this.config.sitemapSampleSize,
        this.config.sitemapAnalyzeLimit,
      );

      const sampledUrls = await this.urlIndexability.analyzeUrls(sample);
      const deepUrls = await this.analyzeDeepUrls(sampledUrls, deepAnalysis);
      const deepUrlAnalysis = this.deepUrlAnalysis.analyze(deepUrls);

      const scoring = this.scoring.compute(
        homepage,
        sitemapResult.sitemapUrls,
        sampledUrls,
      );
      const fullQuickWins = Array.from(
        new Set([
          ...scoring.quickWins,
          ...deepUrlAnalysis.findings.map((finding) => finding.recommendation),
        ]),
      ).slice(0, 12);

      await this.repo.updateState(auditId, {
        progress: 60,
        step: 'Génération du résumé',
        keyChecks: {
          ...scoring.keyChecks,
          deepUrlAnalysis: deepUrlAnalysis.metrics,
          crawlCoverage: {
            sitemapUrls: sitemapResult.urls.length,
            internalLinks: homepage.internalLinks.length,
            candidateUrls: candidateUrls.length,
            sampledUrls: sample.length,
            analyzedUrls: deepUrls.length,
          },
        },
        quickWins: fullQuickWins,
        pillarScores: scoring.pillarScores,
      });

      const llmOutput = await this.llmReport.generate({
        websiteName: audit.websiteName,
        normalizedUrl: normalized.normalizedUrl,
        keyChecks: {
          ...scoring.keyChecks,
          deepUrlAnalysis: deepUrlAnalysis.metrics,
        },
        quickWins: fullQuickWins,
        pillarScores: scoring.pillarScores,
        deepFindings: deepUrlAnalysis.findings,
        sampledUrls: deepUrls.map((entry) => ({
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
          error: entry.error,
        })),
      });

      await this.repo.updateState(auditId, {
        progress: 80,
        step: 'Préparation du rapport final',
      });

      const fullReport = this.buildFullReport({
        llmOutput,
        instantSummaryText,
        homepage,
        sitemapResult,
        candidateUrls,
        sampledUrls,
        deepUrls,
        deepUrlAnalysis,
        scoring,
      });

      await this.repo.updateState(auditId, {
        processingStatus: 'COMPLETED',
        progress: 100,
        step: 'Audit terminé',
        done: true,
        summaryText: llmOutput.summaryText,
        fullReport,
        finishedAt: new Date(),
      });

      void this.mailer
        .sendAuditReportNotification({
          auditId,
          websiteName: audit.websiteName,
          contactMethod: audit.contactMethod,
          contactValue: audit.contactValue,
          summaryText: llmOutput.summaryText,
          fullReport,
        })
        .catch((error) =>
          this.logger.warn(
            `Audit report email failed for ${auditId}: ${String(error)}`,
          ),
        );
    } catch (error) {
      await this.repo.updateState(auditId, {
        processingStatus: 'FAILED',
        progress: 100,
        step: 'Audit en échec',
        done: false,
        error: this.toSafeError(error),
        finishedAt: new Date(),
      });
    }
  }

  private async analyzeDeepUrls(
    sampledUrls: UrlIndexabilityResult[],
    deepAnalysisUrls: string[],
  ): Promise<UrlIndexabilityResult[]> {
    const already = new Set(sampledUrls.map((item) => item.url));
    const extraUrls = deepAnalysisUrls.filter((url) => !already.has(url));
    const extraResults = await this.urlIndexability.analyzeUrls(extraUrls);
    return [...sampledUrls, ...extraResults];
  }

  private buildFullReport(input: {
    llmOutput: LangchainAuditOutput;
    instantSummaryText: string;
    homepage: ReturnType<HomepageAnalyzerService['analyze']>;
    sitemapResult: { sitemapUrls: string[]; urls: string[] };
    candidateUrls: string[];
    sampledUrls: UrlIndexabilityResult[];
    deepUrls: UrlIndexabilityResult[];
    deepUrlAnalysis: DeepUrlAnalysisResult;
    scoring: ReturnType<ScoringService['compute']>;
  }): Record<string, unknown> {
    return {
      generatedAt: new Date().toISOString(),
      instantSummary: input.instantSummaryText,
      homepage: input.homepage,
      sitemap: {
        sitemapUrls: input.sitemapResult.sitemapUrls,
        totalUrlsDiscovered: input.sitemapResult.urls.length,
        candidateUrls: input.candidateUrls.length,
        sampledUrls: input.sampledUrls,
        deepUrlAnalysis: input.deepUrls,
      },
      findings: input.deepUrlAnalysis.findings,
      deepMetrics: input.deepUrlAnalysis.metrics,
      scoring: {
        pillarScores: input.scoring.pillarScores,
        quickWins: input.scoring.quickWins,
        keyChecks: input.scoring.keyChecks,
      },
      llm: input.llmOutput.adminReport,
    };
  }

  private buildInstantSummary(
    homepage: ReturnType<HomepageAnalyzerService['analyze']>,
    pillarScores: Record<string, number>,
    quickWins: string[],
  ): string {
    const topScores = Object.entries(pillarScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([pillar, score]) => `${pillar}: ${score}/100`)
      .join(', ');
    const immediateActions =
      quickWins.length > 0
        ? quickWins.join(' ')
        : 'Aucune action critique immédiate.';

    return `Premier diagnostic disponible. Votre page d’accueil répond en ${homepage.totalResponseMs}ms avec un statut HTTP ${homepage.statusCode}. Les premiers scores montrent: ${topScores}. Actions prioritaires immédiates: ${immediateActions}`;
  }

  private toSafeError(error: unknown): string {
    const message =
      error instanceof Error ? error.message : 'Unexpected audit error';
    return message.length > 280 ? `${message.slice(0, 280)}...` : message;
  }
}
