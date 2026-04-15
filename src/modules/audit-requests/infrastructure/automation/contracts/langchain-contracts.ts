/**
 * Contrats publics du service `LangchainAuditReportService`.
 *
 * Ce fichier regroupe les interfaces et types de transport consommes
 * par `audit-pipeline.service.ts` et par les tests/utilitaires du
 * pipeline LLM (llm-payload.builder, langchain-fallback-report.builder,
 * et futurs sous-services issus du split C4b). Il ne depend d'aucun
 * framework (Nest, LangChain, Zod) et ne contient aucune logique :
 * uniquement des types purs et des re-exports de types domaine.
 *
 * Regle d'import :
 * - Les fichiers INTERNES a `automation/` peuvent importer directement
 *   depuis ce module.
 * - Les fichiers EXTERNES a `automation/` doivent passer par le
 *   re-export expose dans `langchain-audit-report.service.ts` afin de
 *   conserver un unique point d'entree public.
 */

import type {
  ExpertReportSynthesis,
  PerPageDetailedAnalysis,
} from '../../../domain/AuditReportTiers';
import type { AuditLocale } from '../../../domain/audit-locale.util';

/** Nom de section emise par le pipeline de synthese parallele. */
export type SynthesisSectionName =
  | 'summary'
  | 'executiveSection'
  | 'prioritySection'
  | 'executionSection'
  | 'clientCommsSection';

/** Statut d'une etape de synthese LLM expose via SSE. */
export type SynthesisSectionStatus =
  | 'started'
  | 'completed'
  | 'failed'
  | 'fallback';

/**
 * Evenement de progression emis durant la generation LLM.
 * Consomme par `audit-pipeline.service.ts` pour relayer en SSE.
 */
export interface LlmSynthesisProgressEvent {
  section: SynthesisSectionName;
  sectionStatus: SynthesisSectionStatus;
  iaSubTask: string;
}

/** Options d'appel de `LangchainAuditReportService.generate`. */
export interface LangchainAuditGenerateOptions {
  onProgress?: (progress: LlmSynthesisProgressEvent) => void | Promise<void>;
}

/**
 * Entree du pipeline de synthese LLM.
 * Fabriquee par `audit-pipeline.service.ts` a partir du snapshot d'audit.
 */
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
    /**
     * Optionnel en Phase 5 pour compatibilite ascendante : si present,
     * passe directement dans les payloads LLM et dans le fallback pour
     * construire `perPageAnalysis`.
     */
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

/** Sortie du pipeline de synthese LLM. */
export interface LangchainAuditOutput {
  summaryText: string;
  adminReport: Record<string, unknown>;
  /**
   * Projection typee `ExpertReportSynthesis` destinee au Tier Expert
   * (rapport technique a Tim). Contient perPageAnalysis, cross-findings,
   * priority backlog, clientEmailDraft et internalNotes.
   */
  expertSynthesis: ExpertReportSynthesis;
}

/** Re-export des types domaine utiles aux consommateurs (confort). */
export type { ExpertReportSynthesis, PerPageDetailedAnalysis };
