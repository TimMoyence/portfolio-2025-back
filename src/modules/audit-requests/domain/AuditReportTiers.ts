import type { EngineCoverage } from './EngineCoverage';

/**
 * Synthèse stratégique destinée au client (affichée en SSE + mail client).
 * Orientée décideur non technique, impact business, belle promesse de vente.
 */
export interface ClientReportSynthesis {
  readonly executiveSummary: string;
  readonly topFindings: ReadonlyArray<{
    readonly title: string;
    readonly impact: string;
    readonly severity: 'high' | 'medium' | 'low';
  }>;
  readonly googleVsAiMatrix: {
    readonly googleVisibility: {
      readonly score: number;
      readonly summary: string;
    };
    readonly aiVisibility: {
      readonly score: number;
      readonly summary: string;
    };
  };
  readonly pillarScorecard: ReadonlyArray<{
    readonly pillar: string;
    readonly score: number;
    readonly target: number;
    readonly status: 'critical' | 'warning' | 'ok';
  }>;
  readonly quickWins: ReadonlyArray<{
    readonly title: string;
    readonly businessImpact: string;
    readonly effort: 'low' | 'medium' | 'high';
  }>;
  readonly cta: {
    readonly title: string;
    readonly description: string;
    readonly actionLabel: string;
  };
}

/**
 * Analyse détaillée d'une page pour le rapport expert (destiné à Tim).
 * Regroupe scores par moteur, problèmes majeurs, recommandations et preuves.
 */
export interface PerPageDetailedAnalysis {
  readonly url: string;
  readonly title: string;
  readonly engineScores: EngineCoverage;
  readonly topIssues: ReadonlyArray<string>;
  readonly recommendations: ReadonlyArray<string>;
  readonly evidence: ReadonlyArray<string>;
}

/**
 * Rapport expert complet destiné à Tim (mail + PDF).
 * Contient les analyses page par page, les constats transverses,
 * un backlog priorisé et un draft d'email client prêt à envoyer.
 */
export interface ExpertReportSynthesis {
  readonly executiveSummary: string;
  readonly perPageAnalysis: ReadonlyArray<PerPageDetailedAnalysis>;
  readonly crossPageFindings: ReadonlyArray<{
    readonly title: string;
    readonly severity: 'critical' | 'high' | 'medium' | 'low';
    readonly affectedUrls: ReadonlyArray<string>;
    readonly rootCause: string;
    readonly remediation: string;
  }>;
  readonly priorityBacklog: ReadonlyArray<{
    readonly title: string;
    readonly impact: 'high' | 'medium' | 'low';
    readonly effort: 'high' | 'medium' | 'low';
    readonly acceptanceCriteria: ReadonlyArray<string>;
  }>;
  readonly clientEmailDraft: {
    readonly subject: string;
    readonly body: string;
  };
  readonly internalNotes: string;
}
