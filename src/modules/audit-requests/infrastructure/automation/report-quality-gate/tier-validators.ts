import type { ClientReportSynthesis } from '../../../domain/AuditReportTiers';
import { PILLAR_KEYS } from '../scoring.service';

/**
 * Validation de la Client Report Synthesis (Tier Client — decideurs,
 * decideurs, vue haut-niveau) et du Expert Report (Tier Expert — dev/SEO,
 * execution). Extrait du service quality-gate pour isoler les regles de
 * tier validation du flux principal d'application et normalisation.
 *
 * Les regles ici sont purement structurelles / de presence de champs et
 * n'effectuent AUCUNE normalisation — elles retournent uniquement la
 * liste des issues + un flag `shouldFallback` qui guide le caller sur
 * l'opportunite de remplacer la sortie par une version deterministe.
 */

/** Pattern pour detecter la presence de markdown interdit dans une valeur. */
const MARKDOWN_PATTERN = /(^|[^\w])[*#]{1,3}[^\s]|^\s*-\s+|```/m;

/** Piliers client attendus (7 piliers normaux du framework). */
const REQUIRED_CLIENT_PILLARS: ReadonlyArray<string> = PILLAR_KEYS;

export interface TierValidationResult {
  valid: boolean;
  issues: string[];
  shouldFallback: boolean;
}

/**
 * Valide une synthese client (Tier Client). Regles : pas de markdown,
 * exactement 7 piliers attendus, 3-5 quickWins, CTA complet.
 */
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

/**
 * Valide un rapport expert (Tier Expert). Regles : `perPageAnalysis`
 * non vide, `clientEmailDraft` avec un sujet court non vide et un
 * body > 200 caracteres, `internalNotes` non vide.
 */
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
