import type { ClientReportSynthesis } from '../../../domain/AuditReportTiers';
import { PILLAR_KEYS } from '../scoring.service';

const MARKDOWN_PATTERN = /(^|[^\w])[*#]{1,3}[^\s]|^[ \t]*-[ \t]+|```/m;

const REQUIRED_CLIENT_PILLARS: ReadonlyArray<string> = PILLAR_KEYS;

export interface TierValidationResult {
  valid: boolean;
  issues: string[];
  shouldFallback: boolean;
}

function checkExecutiveSummary(report: ClientReportSynthesis): string[] {
  if (!report.executiveSummary?.trim()) {
    return ['client_report_missing_executive_summary'];
  }
  if (MARKDOWN_PATTERN.test(report.executiveSummary)) {
    return ['client_report_markdown_in_executive_summary'];
  }
  return [];
}

function checkPillarScorecard(report: ClientReportSynthesis): string[] {
  const pillarScorecard = report.pillarScorecard;
  if (!Array.isArray(pillarScorecard) || pillarScorecard.length !== 7) {
    return ['client_report_pillar_scorecard_must_have_exactly_7_entries'];
  }

  const presentKeys = pillarScorecard
    .map((entry: { pillar: string }): string =>
      typeof entry?.pillar === 'string' ? entry.pillar.toLowerCase() : '',
    )
    .filter((key: string): boolean => key.length > 0);

  return REQUIRED_CLIENT_PILLARS.filter(
    (required) => !presentKeys.includes(required.toLowerCase()),
  ).map((required) => `client_report_missing_pillar_${required}`);
}

function checkQuickWins(report: ClientReportSynthesis): string[] {
  const quickWins = report.quickWins;
  if (
    !Array.isArray(quickWins) ||
    quickWins.length < 3 ||
    quickWins.length > 5
  ) {
    return ['client_report_quick_wins_must_be_between_3_and_5'];
  }

  const incomplete = (
    quickWins as ReadonlyArray<{ title: string; businessImpact: string }>
  ).some((quickWin) => {
    const title =
      typeof quickWin?.title === 'string' ? quickWin.title.trim() : '';
    const businessImpact =
      typeof quickWin?.businessImpact === 'string'
        ? quickWin.businessImpact.trim()
        : '';
    return !title || !businessImpact;
  });

  return incomplete ? ['client_report_quick_win_missing_fields'] : [];
}

function checkCta(report: ClientReportSynthesis): string[] {
  const incomplete =
    !report.cta ||
    !report.cta.title?.trim() ||
    !report.cta.description?.trim() ||
    !report.cta.actionLabel?.trim();
  return incomplete ? ['client_report_cta_incomplete'] : [];
}

function checkTopFindings(report: ClientReportSynthesis): string[] {
  const topFindings = report.topFindings;
  if (!Array.isArray(topFindings) || topFindings.length === 0) {
    return ['client_report_missing_top_findings'];
  }
  if (topFindings.length > 5) {
    return ['client_report_top_findings_exceeds_maximum'];
  }

  const hasMarkdownTitle = (
    topFindings as ReadonlyArray<{ title: string }>
  ).some((finding) =>
    MARKDOWN_PATTERN.test(
      typeof finding?.title === 'string' ? finding.title : '',
    ),
  );

  return hasMarkdownTitle ? ['client_report_markdown_in_finding_title'] : [];
}

export function validateClientReport(
  report: ClientReportSynthesis,
): TierValidationResult {
  const issues = [
    ...checkExecutiveSummary(report),
    ...checkPillarScorecard(report),
    ...checkQuickWins(report),
    ...checkCta(report),
    ...checkTopFindings(report),
  ];

  return {
    valid: issues.length === 0,
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
