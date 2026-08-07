import type { ClientReportSynthesis } from '../../../domain/AuditReportTiers';
import { PILLAR_KEYS } from '../scoring.service';

const MARKDOWN_PATTERN = /(^|[^\w])[*#]{1,3}[^\s]|^\s*-\s+|```/m;

const REQUIRED_CLIENT_PILLARS: ReadonlyArray<string> = PILLAR_KEYS;

export interface TierValidationResult {
  valid: boolean;
  issues: string[];
  shouldFallback: boolean;
}

export function validateClientReport(
  report: ClientReportSynthesis,
): TierValidationResult {
  const issues: string[] = [];

  if (!report.executiveSummary?.trim()) {
    issues.push('client_report_missing_executive_summary');
  } else if (MARKDOWN_PATTERN.test(report.executiveSummary)) {
    issues.push('client_report_markdown_in_executive_summary');
  }

  const pillarScorecard = report.pillarScorecard;
  if (!Array.isArray(pillarScorecard) || pillarScorecard.length !== 7) {
    issues.push('client_report_pillar_scorecard_must_have_exactly_7_entries');
  } else {
    const presentKeys = pillarScorecard
      .map((entry: { pillar: string }): string =>
        typeof entry?.pillar === 'string' ? entry.pillar.toLowerCase() : '',
      )
      .filter((key: string): boolean => key.length > 0);
    for (const required of REQUIRED_CLIENT_PILLARS) {
      if (!presentKeys.includes(required.toLowerCase())) {
        issues.push(`client_report_missing_pillar_${required}`);
      }
    }
  }

  const quickWins = report.quickWins;
  if (
    !Array.isArray(quickWins) ||
    quickWins.length < 3 ||
    quickWins.length > 5
  ) {
    issues.push('client_report_quick_wins_must_be_between_3_and_5');
  } else {
    for (const quickWin of quickWins as ReadonlyArray<{
      title: string;
      businessImpact: string;
    }>) {
      const title =
        typeof quickWin?.title === 'string' ? quickWin.title.trim() : '';
      const businessImpact =
        typeof quickWin?.businessImpact === 'string'
          ? quickWin.businessImpact.trim()
          : '';
      if (!title || !businessImpact) {
        issues.push('client_report_quick_win_missing_fields');
        break;
      }
    }
  }

  if (
    !report.cta ||
    !report.cta.title?.trim() ||
    !report.cta.description?.trim() ||
    !report.cta.actionLabel?.trim()
  ) {
    issues.push('client_report_cta_incomplete');
  }

  const topFindings = report.topFindings;
  if (!Array.isArray(topFindings) || topFindings.length === 0) {
    issues.push('client_report_missing_top_findings');
  } else if (topFindings.length > 5) {
    issues.push('client_report_top_findings_exceeds_maximum');
  } else {
    for (const finding of topFindings as ReadonlyArray<{ title: string }>) {
      const title = typeof finding?.title === 'string' ? finding.title : '';
      if (MARKDOWN_PATTERN.test(title)) {
        issues.push('client_report_markdown_in_finding_title');
        break;
      }
    }
  }

  const valid = issues.length === 0;
  return {
    valid,
    issues,
    shouldFallback: issues.some(
      (issue) =>
        issue.includes('executive_summary') ||
        issue.includes('pillar') ||
        issue.includes('quick_wins') ||
        issue.includes('cta_incomplete'),
    ),
  };
}

export function validateExpertReport(report: {
  perPageAnalysis?: ReadonlyArray<unknown>;
  clientEmailDraft?: { subject?: string; body?: string } | null;
  internalNotes?: string;
}): TierValidationResult {
  const issues: string[] = [];

  if (
    !Array.isArray(report.perPageAnalysis) ||
    report.perPageAnalysis.length === 0
  ) {
    issues.push('expert_report_per_page_analysis_missing');
  }

  const draft = report.clientEmailDraft;
  if (!draft) {
    issues.push('expert_report_client_email_draft_missing');
  } else {
    const subject = (draft.subject ?? '').trim();
    const body = (draft.body ?? '').trim();
    if (!subject) {
      issues.push('expert_report_client_email_subject_empty');
    } else if (subject.length >= 100) {
      issues.push('expert_report_client_email_subject_too_long');
    }
    if (!body) {
      issues.push('expert_report_client_email_body_empty');
    } else if (body.length <= 200) {
      issues.push('expert_report_client_email_body_too_short');
    }
  }

  if (
    typeof report.internalNotes !== 'string' ||
    report.internalNotes.trim().length === 0
  ) {
    issues.push('expert_report_internal_notes_missing');
  }

  const valid = issues.length === 0;
  return {
    valid,
    issues,
    shouldFallback: issues.some(
      (issue) =>
        issue.includes('per_page') ||
        issue.includes('client_email_draft_missing') ||
        issue.includes('internal_notes'),
    ),
  };
}
