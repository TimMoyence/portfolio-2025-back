import type {
  ExpertReportSynthesis,
  PerPageDetailedAnalysis,
  ReportSeverity,
} from '../../../domain/AuditReportTiers';
import type { AuditLocale } from '../../../domain/audit-locale.util';
import type { EngineCoverage } from '../../../domain/EngineCoverage';
import type { DeepUrlFinding } from '../deep-url-analysis.service';
import type { TechFingerprint } from '../schemas/audit-report.schemas';
import type { EnTetesTechniques } from '../shared/html-signals.util';

type SynthesisSectionName =
  | 'summary'
  | 'executiveSection'
  | 'prioritySection'
  | 'executionSection'
  | 'clientCommsSection';

type SynthesisSectionStatus = 'started' | 'completed' | 'failed' | 'fallback';

export interface LlmSynthesisProgressEvent {
  section: SynthesisSectionName;
  sectionStatus: SynthesisSectionStatus;
  iaSubTask: string;
}

export interface LangchainAuditGenerateOptions {
  onProgress?: (progress: LlmSynthesisProgressEvent) => void | Promise<void>;
}

export interface LangchainAuditInput {
  auditId?: string;
  locale: AuditLocale;
  websiteName: string;
  normalizedUrl: string;
  keyChecks: Record<string, unknown>;
  quickWins: string[];
  pillarScores: Record<string, number>;
  deepFindings: DeepUrlFinding[];
  sampledUrls: Array<
    EnTetesTechniques & {
      url: string;
      statusCode: number | null;
      indexable: boolean;
      canonical: string | null;
      title?: string | null;
      metaDescription?: string | null;
      h1Count?: number;
      htmlLang?: string | null;
      canonicalCount?: number;
      responseTimeMs?: number | null;
      error: string | null;
    }
  >;
  pageRecaps: Array<{
    url: string;
    priority: ReportSeverity;
    wordingScore: number;
    trustScore: number;
    ctaScore: number;
    seoCopyScore: number;
    topIssues: string[];
    recommendations: string[];
    source: 'llm' | 'fallback';
    engineScores?: EngineCoverage;
    title?: string | null;
  }>;
  pageSummary: Record<string, unknown>;
  techFingerprint: TechFingerprint;
}

export interface LangchainAuditOutput {
  summaryText: string;
  adminReport: Record<string, unknown>;
  expertSynthesis: ExpertReportSynthesis;
}

export type { ExpertReportSynthesis, PerPageDetailedAnalysis };
