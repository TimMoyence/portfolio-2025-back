import { estObjet } from '../../../../common/domain/est-objet';
import type { ReportSeverity } from '../../domain/AuditReportTiers';
import type { AuditAutomationConfig, AuditLlmProfile } from './audit.config';
import type {
  ExpertReportSynthesis,
  LangchainAuditInput,
  PerPageDetailedAnalysis,
} from './contracts/langchain-contracts';
import { normalizeSeverity } from './shared/severity.util';

export function toEffort(value: unknown): ReportSeverity {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'medium';
  if (value >= 8) return 'high';
  if (value <= 3) return 'low';
  return 'medium';
}

export function normalizeClientEmailDraft(
  raw: unknown,
): { subject: string; body: string } | null {
  if (!estObjet(raw)) return null;
  const subject = typeof raw.subject === 'string' ? raw.subject : '';
  const body = typeof raw.body === 'string' ? raw.body : '';
  if (!subject.trim() || !body.trim()) return null;
  return { subject: subject.trim(), body: body.trim() };
}

export function buildFallbackEmailDraft(input: LangchainAuditInput): {
  subject: string;
  body: string;
} {
  const subject =
    input.locale === 'en'
      ? `Audit findings for ${input.websiteName}`
      : `Audit ${input.websiteName} : vos priorites`;
  const body =
    input.locale === 'en'
      ? `Hello,\n\nThe audit of ${input.websiteName} is ready. I would love to walk you through it in 30 minutes.\n\nTim / Asili Design`
      : `Bonjour,\n\nL'audit de ${input.websiteName} est pret. J'aimerais vous le presenter en 30 minutes.\n\nTim / Asili Design`;
  return { subject, body };
}

export function buildFallbackNotes(input: LangchainAuditInput): string {
  return input.locale === 'en'
    ? `Internal notes for ${input.websiteName}: review the priorities and prepare the 30-minute pitch.`
    : `Notes internes pour ${input.websiteName} : revue des priorites et preparation du pitch 30 minutes.`;
}

const TEXTES_PAR_RUBRIQUE_DE_PAGE = 6;

function premiersTextes(valeur: unknown): string[] {
  return Array.isArray(valeur)
    ? valeur.map(String).slice(0, TEXTES_PAR_RUBRIQUE_DE_PAGE)
    : [];
}

export function projectPerPageAnalysis(
  raw: unknown,
): ReadonlyArray<PerPageDetailedAnalysis> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry: unknown): PerPageDetailedAnalysis | null => {
      if (!estObjet(entry)) return null;
      const url = typeof entry.url === 'string' ? entry.url : '';
      if (!url) return null;
      const engineScores = entry.engineScores as
        | PerPageDetailedAnalysis['engineScores']
        | undefined;
      if (!engineScores) return null;
      return {
        url,
        title: typeof entry.title === 'string' ? entry.title : '',
        engineScores,
        topIssues: premiersTextes(entry.topIssues),
        recommendations: premiersTextes(entry.recommendations),
        evidence: premiersTextes(entry.evidence),
      };
    })
    .filter((entry): entry is PerPageDetailedAnalysis => entry !== null);
}

export function buildExpertSynthesis(
  summaryText: string,
  adminReport: Record<string, unknown>,
  input: LangchainAuditInput,
): ExpertReportSynthesis {
  const executiveSummary =
    typeof adminReport.executiveSummary === 'string' &&
    adminReport.executiveSummary.trim().length > 0
      ? adminReport.executiveSummary
      : summaryText;

  const perPageAnalysis = projectPerPageAnalysis(adminReport.perPageAnalysis);

  const crossPageFindings = input.deepFindings.map((finding) => ({
    title: finding.title,
    severity: finding.severity,
    affectedUrls: [...finding.affectedUrls],
    rootCause: finding.description,
    remediation: finding.recommendation,
  }));

  const priorityBacklog = Array.isArray(adminReport.implementationBacklog)
    ? (adminReport.implementationBacklog as Array<Record<string, unknown>>)
        .slice(0, 12)
        .map((entry) => ({
          title: typeof entry.task === 'string' ? entry.task : '',
          impact: normalizeSeverity(entry.priority),
          effort: toEffort(entry.estimatedHours),
          acceptanceCriteria: Array.isArray(entry.acceptanceCriteria)
            ? (entry.acceptanceCriteria as string[]).map(String)
            : [],
        }))
        .filter((entry) => entry.title.length > 0)
    : [];

  const clientEmailDraft =
    normalizeClientEmailDraft(adminReport.clientEmailDraft) ??
    buildFallbackEmailDraft(input);

  const internalNotes =
    typeof adminReport.internalNotes === 'string' &&
    adminReport.internalNotes.trim().length > 0
      ? adminReport.internalNotes.trim()
      : buildFallbackNotes(input);

  return {
    executiveSummary,
    perPageAnalysis,
    crossPageFindings,
    priorityBacklog,
    clientEmailDraft,
    internalNotes,
  };
}

function hashToPercent(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

export function resolveProfile(
  auditId: string | undefined,
  config: AuditAutomationConfig,
): AuditLlmProfile {
  const configured = config.llmProfile;
  if (configured !== 'parallel_sections_v1') {
    return 'stability_first_sequential';
  }

  const canaryPercent = config.llmProfileCanaryPercent;
  if (canaryPercent >= 100) return 'parallel_sections_v1';
  if (canaryPercent <= 0) return 'stability_first_sequential';
  if (!auditId) return 'parallel_sections_v1';

  const bucket = hashToPercent(auditId);
  return bucket < canaryPercent
    ? 'parallel_sections_v1'
    : 'stability_first_sequential';
}
