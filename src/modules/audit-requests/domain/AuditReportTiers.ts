import type { EngineCoverage } from './EngineCoverage';

type ReportSeverity = 'high' | 'medium' | 'low';
type CrossPageSeverity = 'critical' | ReportSeverity;

export interface ClientReportSynthesis {
  readonly executiveSummary: string;
  readonly topFindings: ReadonlyArray<{
    readonly title: string;
    readonly impact: string;
    readonly severity: ReportSeverity;
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

export interface PerPageDetailedAnalysis {
  readonly url: string;
  readonly title: string;
  readonly engineScores: EngineCoverage;
  readonly topIssues: ReadonlyArray<string>;
  readonly recommendations: ReadonlyArray<string>;
  readonly evidence: ReadonlyArray<string>;
}

export interface ExpertReportSynthesis {
  readonly executiveSummary: string;
  readonly perPageAnalysis: ReadonlyArray<PerPageDetailedAnalysis>;
  readonly crossPageFindings: ReadonlyArray<{
    readonly title: string;
    readonly severity: CrossPageSeverity;
    readonly affectedUrls: ReadonlyArray<string>;
    readonly rootCause: string;
    readonly remediation: string;
  }>;
  readonly priorityBacklog: ReadonlyArray<{
    readonly title: string;
    readonly impact: ReportSeverity;
    readonly effort: ReportSeverity;
    readonly acceptanceCriteria: ReadonlyArray<string>;
  }>;
  readonly clientEmailDraft: {
    readonly subject: string;
    readonly body: string;
  };
  readonly internalNotes: string;
}
