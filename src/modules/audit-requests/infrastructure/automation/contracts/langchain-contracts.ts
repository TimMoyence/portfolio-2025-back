import type {
  ExpertReportSynthesis,
  PerPageDetailedAnalysis,
} from '../../../domain/AuditReportTiers';
import type { AuditLocale } from '../../../domain/audit-locale.util';

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
  deepFindings: Array<{
    code: string;
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    confidence: number;
    impact: 'traffic' | 'indexation' | 'conversion';
    affectedUrls: string[];
    recommendation: string;
  }>;
  sampledUrls: Array<{
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
    server?: string | null;
    xPoweredBy?: string | null;
    setCookiePatterns?: string[];
    cacheHeaders?: Record<string, string>;
    securityHeaders?: Record<string, string>;
    error: string | null;
  }>;
  pageRecaps: Array<{
    url: string;
    priority: 'high' | 'medium' | 'low';
    wordingScore: number;
    trustScore: number;
    ctaScore: number;
    seoCopyScore: number;
    topIssues: string[];
    recommendations: string[];
    source: 'llm' | 'fallback';
    engineScores?: {
      google: {
        engine: 'google';
        score: number;
        indexable: boolean;
        strengths: string[];
        blockers: string[];
        opportunities: string[];
      };
      bingChatGpt: {
        engine: 'bing_chatgpt';
        score: number;
        indexable: boolean;
        strengths: string[];
        blockers: string[];
        opportunities: string[];
      };
      perplexity: {
        engine: 'perplexity';
        score: number;
        indexable: boolean;
        strengths: string[];
        blockers: string[];
        opportunities: string[];
      };
      geminiOverviews: {
        engine: 'gemini_overviews';
        score: number;
        indexable: boolean;
        strengths: string[];
        blockers: string[];
        opportunities: string[];
      };
    };
    title?: string | null;
  }>;
  pageSummary: Record<string, unknown>;
  techFingerprint: {
    primaryStack: string;
    confidence: number;
    evidence: string[];
    alternatives: string[];
    unknowns: string[];
  };
}

export interface LangchainAuditOutput {
  summaryText: string;
  adminReport: Record<string, unknown>;
  expertSynthesis: ExpertReportSynthesis;
}

export type { ExpertReportSynthesis, PerPageDetailedAnalysis };
