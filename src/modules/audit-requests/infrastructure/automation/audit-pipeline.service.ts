import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IAuditRequestsRepository } from '../../domain/IAuditRequests.repository';
import {
  AUDIT_AUTOMATION_CONFIG,
  AUDIT_REQUESTS_REPOSITORY,
} from '../../domain/token';
import { AuditRequestMailerService } from '../AuditRequestMailer.service';
import type { AuditAutomationConfig } from './audit.config';
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

      await this.repo.updateState(auditId, {
        progress: 30,
        step: 'Analyse sitemap',
        finalUrl: homepage.finalUrl,
        redirectChain: homepage.redirectChain,
      });

      const sitemapResult = await this.sitemapDiscovery.discover(
        homepage.finalUrl,
      );
      const { sample, deepAnalysis } = pickUrlSample(
        sitemapResult.urls,
        this.config.sitemapSampleSize,
        this.config.sitemapAnalyzeLimit,
      );

      const sampledUrls = await this.urlIndexability.analyzeUrls(sample);
      const deepUrls = await this.analyzeDeepUrls(sampledUrls, deepAnalysis);

      const scoring = this.scoring.compute(
        homepage,
        sitemapResult.sitemapUrls,
        sampledUrls,
      );

      await this.repo.updateState(auditId, {
        progress: 60,
        step: 'Génération du résumé',
        keyChecks: scoring.keyChecks,
        quickWins: scoring.quickWins,
        pillarScores: scoring.pillarScores,
      });

      const llmOutput = await this.llmReport.generate({
        websiteName: audit.websiteName,
        normalizedUrl: normalized.normalizedUrl,
        keyChecks: scoring.keyChecks,
        quickWins: scoring.quickWins,
        pillarScores: scoring.pillarScores,
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
        homepage,
        sitemapResult,
        sampledUrls,
        deepUrls,
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
    homepage: ReturnType<HomepageAnalyzerService['analyze']>;
    sitemapResult: { sitemapUrls: string[]; urls: string[] };
    sampledUrls: UrlIndexabilityResult[];
    deepUrls: UrlIndexabilityResult[];
    scoring: ReturnType<ScoringService['compute']>;
  }): Record<string, unknown> {
    return {
      generatedAt: new Date().toISOString(),
      homepage: input.homepage,
      sitemap: {
        sitemapUrls: input.sitemapResult.sitemapUrls,
        totalUrlsDiscovered: input.sitemapResult.urls.length,
        sampledUrls: input.sampledUrls,
        deepUrlAnalysis: input.deepUrls,
      },
      scoring: {
        pillarScores: input.scoring.pillarScores,
        quickWins: input.scoring.quickWins,
        keyChecks: input.scoring.keyChecks,
      },
      llm: input.llmOutput.adminReport,
    };
  }

  private toSafeError(error: unknown): string {
    const message =
      error instanceof Error ? error.message : 'Unexpected audit error';
    return message.length > 280 ? `${message.slice(0, 280)}...` : message;
  }
}
